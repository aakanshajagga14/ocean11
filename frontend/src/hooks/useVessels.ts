import { useEffect, useState } from 'react';
import { getVesselSnapshot } from '../api/vessels';
import { useVesselStore } from '../store/vesselStore';

export function useVessels() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getVesselSnapshot()
      .then((vessels) => {
        if (mounted) {
          useVesselStore.getState().setVesselSnapshot(vessels);
          setError(null);
        }
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load vessels');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error };
}
