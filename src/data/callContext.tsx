import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type CallState = {
  active: boolean;
  minimized: boolean;
  vetId: string | null;
  startedAt: number;
};

type CallContextValue = {
  state: CallState;
  startCall: (vetId: string) => void;
  endCall: () => void;
  minimize: () => void;
  maximize: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CallState>({
    active: false,
    minimized: false,
    vetId: null,
    startedAt: 0,
  });

  const value = useMemo<CallContextValue>(
    () => ({
      state,
      startCall: (vetId: string) =>
        setState({
          active: true,
          minimized: false,
          vetId,
          startedAt: Date.now(),
        }),
      endCall: () =>
        setState({
          active: false,
          minimized: false,
          vetId: null,
          startedAt: 0,
        }),
      minimize: () => setState((s) => ({ ...s, minimized: true })),
      maximize: () => setState((s) => ({ ...s, minimized: false })),
    }),
    [state],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export const useCall = (): CallContextValue => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};
