import { useCallback, useEffect, useRef, useState } from "react";
import { ChatRepository } from "../data/repositories/ChatRepository";

type Params = {
  model: string;
  getActiveConversationId: () => string;
  onToken: (conversationId: string, token: string) => void;
  onDone: (conversationId: string, fullText: string) => void;
  vectorStore?: any;
  llm?: any;
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
  vectorStore,
  llm,
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

    if (!enabled || model === "tofa-offline") {
      cleanup(retry);
      if (model === "tofa-offline") setStatus("idle");
      return () => {
        retry.stopped = true;
        cleanup(retry);
      };
    }

    const connect = () => {
      if (retry.stopped) return;

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
          console.log("[WS TIMEOUT] Saving due to inactivity", {
            cid,
            len: fullRef.current.length,
          });
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
  }, [model, enabled, cleanup, flushDone]);

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

  const send = useCallback(async (text: string, cid?: string) => {
    if (cid) {
      currentCidRef.current = cid;
    }
    const targetCid = cid || getCidRef.current();

    // --- OFFLINE PATH ---
    if (model === 'tofa-offline') {
      if (!vectorStore || !llm) {
        console.warn("Offline components missing");
        return false;
      }

      try {
        console.log("Starting Offline RAG for:", text);
        
        let contextText = "";
        try {
          // 1. Fetch Top 5 Text Chunks with 0.4 threshold (matching server)
          const textResults = await vectorStore.query({ 
            queryText: text, 
            nResults: 5,
            predicate: (r) => (r.similarity || 0) >= 0.4 && r.metadata?.content_type !== 'image'
          });

          // 2. Fetch Top 2 Image Captions with 0.4 threshold
          const imageResults = await vectorStore.query({ 
            queryText: text, 
            nResults: 2,
            predicate: (r) => (r.similarity || 0) >= 0.4 && r.metadata?.content_type === 'image'
          });
          
          const combinedResults = [...textResults, ...imageResults];

          if (combinedResults.length > 0) {
            console.log("--- RAG Retrieval Results (Threshold 0.4) ---");
            combinedResults.forEach((r: any, i: number) => {
              const meta = r.metadata || {};
              const source = meta.source_file || "unknown";
              const page = meta.page || meta.page_number || "?";
              const type = meta.content_type === 'image' ? 'IMG' : 'TXT';
              console.log(`[${type}] ${source} (p.${page}), Score: ${r.similarity?.toFixed(3)}`);
            });
            console.log("-----------------------------");

            contextText = combinedResults.map((r: any) => {
              const meta = r.metadata || {};
              const source = meta.source_file || "unknown";
              const page = meta.page || meta.page_number || "?";
              const type = meta.content_type === 'image' ? 'Visual Content' : 'Text';
              return `[${type} | ${source} p.${page}]\n${r.document}`;
            }).join("\n\n---\n\n");
          } else {
            console.log("No relevant RAG context found above 0.4 threshold.");
            contextText = "No relevant information found in the documents.";
          }
          
          console.log("Final context length:", contextText.length);
        } catch (e) {
          console.warn("Failed to retrieve context:", e);
          contextText = "No relevant information found in the documents.";
        }

        // 3. Fetch Chat History (matching server limit=6)
        let historyMessages: any[] = [];
        try {
          const localHistory = await ChatRepository.getMessagesByConversation(targetCid, 6);
          historyMessages = localHistory.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }));
          console.log(`Included ${historyMessages.length} messages from history.`);
        } catch (e) {
          console.warn("Failed to load chat history for RAG:", e);
        }

        const systemPrompt = `You are a helpful assistant that specialises in agriculture in the Lake Toba Region in North Sumatra, Indonesia. 
                              Your name is ToFa (stands for Toba Farm). You answer questions based on your knowledge, with some added knowledge from the context below. 

                              IMPORTANT: The context below may contain descriptions of images from the documents, marked as "[Visual Content | ...]". Use these descriptions to answer questions about figures, photos, or diagrams.

                              You must answer based on the knowledge provided and our previous conversation.
                              If you don't know the answer, just say: I'm sorry, I cannot answer that.
                              --------------------

        The context:
        ${contextText}`;

        onTokenRef.current(targetCid, ""); // Signal start
        
        const full = await llm.generate(
          [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: text }
          ],
          (token: string) => {
            fullRef.current += token;
            onTokenRef.current(targetCid, token);
          }
        );

        console.log("Offline generation complete");
        onDoneRef.current(targetCid, full);
        fullRef.current = "";
        currentCidRef.current = null;
        return true;
      } catch (err) {
        console.error("Offline generation failed:", err);
        return false;
      }
    }

    // --- ONLINE PATH ---
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    ws.send(text);
    return true;
  }, [model, vectorStore, llm]);

  return { send, status, stop };
}

