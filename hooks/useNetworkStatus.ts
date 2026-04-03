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

  const connectionRef = useRef<boolean | null>(null);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      connectionRef.current = isConnected;
      setNetworkState({
        isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = connectionRef.current;
      const isNowConnected = state.isConnected ?? false;

      if (wasConnected !== null) {
        if (wasConnected && !isNowConnected) {
          setJustDisconnected(true);
          setTimeout(() => setJustDisconnected(false), 2000);
        }

        if (!wasConnected && isNowConnected) {
          setJustConnected(true);
          setTimeout(() => setJustConnected(false), 2000);
        }
      }

      connectionRef.current = isNowConnected;
      setNetworkState({
        isConnected: isNowConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);
  return {
    ...networkState,
    justDisconnected,
    justConnected,
  };
};