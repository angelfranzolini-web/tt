import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState } from "./types";
import { getSeedState } from "./seedData";
import { reducer, migrate, type Action } from "./shared/reducer";
import { wsUrl } from "./backend";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface StoreContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  status: ConnectionStatus;
  ready: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  token: string;
  onUnauthorized: () => void;
  children: ReactNode;
}

export function StoreProvider({ token, onUnauthorized, children }: StoreProviderProps) {
  const [state, setState] = useState<AppState>(() => getSeedState());
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [ready, setReady] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (cancelled) return;
      setStatus("connecting");
      const ws = new WebSocket(wsUrl(token));
      socketRef.current = ws;

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; state?: AppState };
          if (msg.type === "state" && msg.state) {
            setState(migrate(msg.state as never));
            setReady(true);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (cancelled) return;
        if (event.code === 4401) {
          onUnauthorized();
          return;
        }
        setStatus("disconnected");
        retryTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [token, onUnauthorized]);

  function dispatch(action: Action) {
    setState((prev) => reducer(prev, action));
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "action", action }));
    }
  }

  const value = useMemo(() => ({ state, dispatch, status, ready }), [state, status, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
