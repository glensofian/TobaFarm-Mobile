import { useEffect, useRef, useState } from "react";
import { createConversationsApi } from "../api/conversationsApi";
import { ChatRepository } from "../data/repositories/ChatRepository";
import { UserProfile } from "../types";

interface SyncParams {
  user: UserProfile | null;
  isInternetReachable: boolean | null;
}

export const useSyncChat = ({ user, isInternetReachable }: SyncParams) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const api = createConversationsApi();
  const syncInProgressRef = useRef(false);

  const syncData = async () => {
    if (syncInProgressRef.current || !isInternetReachable || !user) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);
    setLastError(null);

    try {
      console.log("Starting chat sync...");

      // Sync Conversations First
      const unsyncedConvs = await ChatRepository.getUnsyncedConversations();
      for (const conv of unsyncedConvs) {
        try {
          console.log(`Syncing conversation: ${conv.title}`);
          const result = await api.createConversation();

          if (result && result.id) {
            const serverId = result.id;

            // Rename to match local title if it's not the default
            if (conv.title && conv.title !== "Percakapan Baru") {
              await api.renameConversation(serverId, conv.title);
            }

            await ChatRepository.markConversationSynced(conv.id, serverId);
            console.log(`Conversation synced: ${conv.id} -> ${serverId}`);
          }
        } catch (err) {
          console.error(`Failed to sync conversation ${conv.id}:`, err);
        }
      }

      // Sync Messages
      const unsyncedMsgs = await ChatRepository.getUnsyncedMessages();
      for (const msg of unsyncedMsgs) {
        try {
          // Get the server_id of the parent conversation
          const parentConv = await ChatRepository.getConversation(
            msg.conversation_id,
          );

          if (parentConv && parentConv.server_id) {
            if (msg.role === "assistant" || (msg as any).role === "bot") {
              await ChatRepository.markMessageSynced(msg.id, "synced");
              continue;
            }

            console.log(`Syncing message: ${msg.id.substring(0, 8)}...`);
            const apiRole: "user" | "assistant" = "user";

            await api.saveMessage(
              parentConv.server_id,
              apiRole as any,
              msg.content,
            );

            // Mark synced locally
            await ChatRepository.markMessageSynced(msg.id, "synced");
            console.log(` Message synced: ${msg.id}`);
          } else {
            console.warn(
              `Cannot sync message ${msg.id}: Parent conversation not synced yet.`,
            );
          }
        } catch (err) {
          console.error(`Failed to sync message ${msg.id}:`, err);
        }
      }

      // Cleanup: Remove synced messages from local SQLite.
      const deletedMsgs = await ChatRepository.deleteSyncedMessages();
      console.log(`✨ Chat sync completed. Removed ${deletedMsgs} synced messages. (Conversations preserved locally)`);
    } catch (err: any) {
      setLastError(err.message || "Sync failed");
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (isInternetReachable && user) {
      syncData();
    }
  }, [isInternetReachable, user]);

  return { isSyncing, lastError, syncData };
};
