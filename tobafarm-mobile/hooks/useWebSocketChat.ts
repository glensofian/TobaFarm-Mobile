import { useCallback, useEffect, useRef, useState } from "react";
import { LlamaContext } from "llama.rn";
import { loadLocalModel } from "../utils/modelDownloader";
import { useNetwork } from "@/context/NetworkContext";
import { useNetworkStatus } from "./useNetworkStatus";

type Params = {
  model: string;
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
  model,
  getActiveConversationId,
  onToken,
  onDone,
  enabled = true,
}: Params) {
  const wsRef = useRef<WebSocket | null>(null);

  const getConversationIdRef = useRef(getActiveConversationId);
  const onTokenRef = useRef(onToken);
  const onDoneRef = useRef(onDone);

  getConversationIdRef.current = getActiveConversationId;
  onTokenRef.current = onToken;
  onDoneRef.current = onDone;

  const currentConversationIdRef = useRef<string | null>(null);

  const fullRef = useRef("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<Status>(enabled ? "connecting" : "idle");

  const retryRef = useRef<RetryState>({
    attempt: 0,
    timer: null,
    stopped: false,
  });
  
  const [llamaContext, setLlamaContext] = useState<LlamaContext | null>(null);
  const [isOfflineLoading, setIsOfflineLoading] = useState(false);

  const {isInternetReachable, isConnected } = useNetwork();
  const {isConnected: isNetworkConnected, justDisconnected, justConnected } = useNetworkStatus();

  const flushDone = useCallback(() => {
    const conversationId = currentConversationIdRef.current || getConversationIdRef.current();
    const full = fullRef.current;
    if (full) {
      console.log("WS Done (flush):", { conversationId, textLen: full.length });
      onDoneRef.current(conversationId, full);
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

    const isOffline = model === "tofa-offline";

    const connect = async () => {
      if (retry.stopped) return;

      if (isOffline) {
        if (!llamaContext && !isOfflineLoading) {
          console.log("Loading local model for:", model);
          setIsOfflineLoading(true);
          setStatus("connecting");
          try {
            const result = await loadLocalModel();
            setIsOfflineLoading(false);
            if (result.success && result.context) {
              setLlamaContext(result.context);
              setStatus("open");
              console.log("Local model loaded successfully");
            } else {
              setStatus("error");
              console.warn("Failed to load local model:", result.error);
            }
          } catch (err) {
            setIsOfflineLoading(false);
            setStatus("error");
            console.error("Local model load crash:", err);
          }
        } else if (llamaContext) {
          setStatus("open");
        }
        return;
      }

      setStatus("connecting");
      let wsUrl = "";
      console.log("WS connecting:", model);
      console.log("WS URL:", process.env.EXPO_PUBLIC_TOFA_AI_URL);

      if (model === "tofa-lite") {
        wsUrl = process.env.EXPO_PUBLIC_TOFA_AI_URL + "/ws-base";
      } else if (model === "tofa-pro") {
        wsUrl = process.env.EXPO_PUBLIC_TOFA_AI_URL + "/ws-rag";
      } else if (model === "tofa-ultra") {
        wsUrl = process.env.EXPO_PUBLIC_TOFA_AI_URL + "/ws-rag";
      }

      if (!wsUrl || wsUrl.startsWith("undefined")) {
        console.warn("No valid WS URL for model:", model);
        setStatus("idle");
        return;
      }

      try {
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
          const conversationId = currentConversationIdRef.current || getConversationIdRef.current();

          if (!currentConversationIdRef.current) {
            currentConversationIdRef.current = conversationId;
          }

          let token = "";

          if (typeof rawData === "string") {
            if (rawData === "[DONE]") {
              const full = fullRef.current;
              if (full) onDoneRef.current(conversationId, full);
              fullRef.current = "";
              currentConversationIdRef.current = null;
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
              }
              return;
            }

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
          onTokenRef.current(conversationId, token);

          saveTimeoutRef.current = setTimeout(() => {
            flushDone();
            currentConversationIdRef.current = null;
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
      } catch (err) {
        console.error("WS constructor error:", err);
        setStatus("error");
      }
    };

    connect();

    return () => {
      retry.stopped = true;
      cleanup(retry);
    };
  }, [model, enabled, cleanup, flushDone, llamaContext, isOfflineLoading]);

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
    currentConversationIdRef.current = null;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback(async (text: string, conversationId?: string) => {
    const isOffline = model === "tofa-offline";
    const threadId = conversationId || currentConversationIdRef.current || getConversationIdRef.current();

    if (isOffline) {
      if (!llamaContext) {
        console.warn("Llama context not ready for offline sending");
        return false;
      }

      currentConversationIdRef.current = threadId;
      fullRef.current = "";

      try {
        console.log("Starting local model completion...");
        await llamaContext.completion(
          {
            messages: [
              { role: 'user', content: text }
            ],
            n_predict: 512,
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9,
            stop: ["<|im_end|>", "### Instruction:", "### User:", "User:", "\n\n"]
          },
          (data) => {
            const token = data.token;
            fullRef.current += token;
            onTokenRef.current(threadId, token);
          }
        );

        console.log("Local completion done");
        onDoneRef.current(threadId, fullRef.current);
        fullRef.current = "";
        currentConversationIdRef.current = null;
        return true;
      } catch (err) {
        console.error("Local inference error:", err);
        return false;
      }
    }

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    currentConversationIdRef.current = threadId;
    ws.send(text);
    return true;
  }, [model, llamaContext]);

  return { send, status, stop };
}
