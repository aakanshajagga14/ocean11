import { getVesselSnapshot } from './vessels';
import { vesselToAlert } from './mappers';
import type { Alert } from '../types';
import { useAgentStore } from '../store/agentStore';

export async function getAlerts(): Promise<Alert[]> {
  const vessels = await getVesselSnapshot();
  const dismissed = useAgentStore.getState().dismissedAlertIds;
  return vessels
    .filter((v) => v.risk_score >= 50 || v.risk_level === 'HIGH' || v.risk_level === 'CRITICAL')
    .map(vesselToAlert)
    .filter((a) => !dismissed.has(a.alert_id))
    .sort((a, b) => b.risk_score - a.risk_score);
}

export function dismissAlert(alertId: string): void {
  useAgentStore.getState().dismissAlert(alertId);
}
