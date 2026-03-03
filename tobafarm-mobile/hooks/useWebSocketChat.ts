import { useCallback, useEffect, useRef, useState } from "react";

type Params = {
  wsUrl: string;
  getActiveConversationId: () => string;
  onToken: (conversationId: string, token: string) => void;
  onDone: (conversationId: string, fullText: string) => void;
  enabled?: boolean;
};

type Status = "idle" | "connecting" | "open" | "closed" | "error";

type RetryState = {
  attempt: number;
  timer: ReturnType<typeof setTimeout> | null;
  stopped: boolean;
};

export function useWebSocketChat({
  wsUrl,
  getActiveConversationId,
  onToken,
  onDone,
  enabled = true,
}: Params) {
  const wsRef = useRef<WebSocket | null>(null);

  const getCidRef = useRef(getActiveConversationId);
  const onTokenRef = useRef(onToken);
  const onDoneRef = useRef(onDone);

  getCidRef.current = getActiveConversationId;
  onTokenRef.current = onToken;
  onDoneRef.current = onDone;

  const currentCidRef = useRef<string | null>(null);

  const fullRef = useRef("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<Status>(enabled ? "connecting" : "idle");

  const retryRef = useRef<RetryState>({
    attempt: 0,
    timer: null,
    stopped: false,
  });

  const flushDone = useCallback(() => {
    const cid = currentCidRef.current || getCidRef.current();
    const full = fullRef.current;
    if (full) {
      console.log("WS Done (flush):", { cid, textLen: full.length });
      onDoneRef.current(cid, full);
    }
    fullRef.current = "";
  }, []);

  const cleanup = useCallback((retry: RetryState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (retry.timer) {
      clearTimeout(retry.timer);
      retry.timer = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.warn("WS close error:", err);
      }
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const retry = retryRef.current;
    retry.stopped = false;

    if (!enabled) {
      cleanup(retry);
      return () => {
        retry.stopped = true;
        cleanup(retry);
      };
    }

    const connect = () => {
      if (retry.stopped) return;

      setStatus("connecting");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retry.attempt = 0;
        setStatus("open");
        console.log("WS connected:", wsUrl);
      };

      ws.onmessage = (event) => {
        const rawData = event.data;
        console.log("WS received:", rawData);
        const cid = currentCidRef.current || getCidRef.current();

        // Lock the CID for this stream
        if (!currentCidRef.current) {
          currentCidRef.current = cid;
        }

        let token = "";

        if (typeof rawData === "string") {
          // Handle [DONE] marker
          if (rawData === "[DONE]") {
            console.log("[WS DONE] marker received", { cid });
            const full = fullRef.current;
            if (full) onDoneRef.current(cid, full);
            fullRef.current = "";
            currentCidRef.current = null;
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = null;
            }
            return;
          }

          // Strict JSON check
          if (rawData.startsWith("{") && rawData.endsWith("}")) {
            try {
              const parsed = JSON.parse(rawData);
              token = parsed.token || parsed.text || parsed.content || rawData;
            } catch {
              token = rawData;
            }
          } else {
            token = rawData;
          }
        } else {
          token = String(rawData ?? "");
        }

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        fullRef.current += token;
        onTokenRef.current(cid, token);

        saveTimeoutRef.current = setTimeout(() => {
          console.log("[WS TIMEOUT] Saving due to inactivity", { cid, len: fullRef.current.length });
          flushDone();
          currentCidRef.current = null;
        }, 1500);
      };

      ws.onclose = () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        flushDone();
        wsRef.current = null;

        if (retry.stopped) {
          setStatus("closed");
          return;
        }

        retry.attempt += 1;
        const delay = Math.min(1000 * 2 ** (retry.attempt - 1), 10_000);

        setStatus("closed");
        retry.timer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setStatus("error");
        console.warn("WS error:", wsUrl);
      };
    };

    connect();

    return () => {
      retry.stopped = true;
      cleanup(retry);
    };
  }, [wsUrl, enabled, cleanup, flushDone]);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setStatus("idle"));
    }
  }, [enabled]);

  const stop = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    fullRef.current = "";
    currentCidRef.current = null;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }


  }, []);

  const send = useCallback((text: string, cid?: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    if (cid) {
      currentCidRef.current = cid;
    }

    ws.send(text);
    return true;
  }, []);

  return { send, status, stop };
}
