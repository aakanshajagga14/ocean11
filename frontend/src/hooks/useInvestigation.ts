import { useCallback, useEffect, useState } from 'react';
import { triggerInvestigation } from '../api/investigations';
import { useAgentStore } from '../store/agentStore';
import type { InvestigateButtonState } from '../types';

export function useInvestigation(mmsi: string | null, vesselName: string) {
  const investigateState = useAgentStore((s) =>
    mmsi ? s.investigateState[mmsi] ?? 'idle' : 'idle',
  );
  const setInvestigateState = useAgentStore((s) => s.setInvestigateState);
  const registerInvestigationId = useAgentStore((s) => s.registerInvestigationId);
  const [error, setError] = useState<string | null>(null);

  const startInvestigation = useCallback(async () => {
    if (!mmsi) return;
    setError(null);
    setInvestigateState(mmsi, 'loading');
    try {
      const id = await triggerInvestigation(mmsi);
      registerInvestigationId(id, mmsi, vesselName);
    } catch (e) {
      setInvestigateState(mmsi, 'error');
      setError(e instanceof Error ? e.message : 'Investigation failed');
    }
  }, [mmsi, vesselName, registerInvestigationId, setInvestigateState]);

  const retry = useCallback(() => {
    if (mmsi) setInvestigateState(mmsi, 'idle');
    void startInvestigation();
  }, [mmsi, setInvestigateState, startInvestigation]);

  const reset = useCallback(() => {
    if (mmsi) setInvestigateState(mmsi, 'idle');
  }, [mmsi, setInvestigateState]);

  return {
    state: investigateState as InvestigateButtonState,
    error,
    startInvestigation,
    retry,
    reset,
  };
}

export function useInvestigationPoll(investigationId: string | null) {
  useEffect(() => {
    if (!investigationId) return;
    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const { getInvestigation } = await import('../api/investigations');
        const inv = await getInvestigation(investigationId);
        useAgentStore.getState().addInvestigation(inv);
      } catch {
        /* ignore poll errors */
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [investigationId]);
}
