// src/hooks/useNetworkStatus.ts
import { useEffect, useState, useCallback, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

interface NetworkState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    type: null,
    isInternetReachable: null,
  });

  const [justDisconnected, setJustDisconnected] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  const connectionRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Get initial state
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      connectionRef.current = isConnected;
      setNetworkState({
        isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    // 2. Subscribe to updates (Event-Driven!)
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = connectionRef.current;
      const isNowConnected = state.isConnected ?? false;

      // Detect transition events
      if (wasConnected && !isNowConnected) {
        setJustDisconnected(true);
        setTimeout(() => setJustDisconnected(false), 2000); // 2s for better visibility
      }

      if (!wasConnected && isNowConnected) {
        setJustConnected(true);
        setTimeout(() => setJustConnected(false), 2000); // 2s for better visibility
      }

      connectionRef.current = isNowConnected; // Update for next event
      setNetworkState({
        isConnected: isNowConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    // 3. Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []); // Run once on mount

  return {
    ...networkState,
    justDisconnected, // True for 1 second after losing connection
    justConnected,    // True for 1 second after gaining connection
  };
};