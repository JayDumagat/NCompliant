import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DataAsset } from '@/db/db';

export function useDataAssets() {
  const assets = useLiveQuery(() => db.dataAssets.toArray(), []) ?? [];

  const assetMap = useMemo(() => {
    return new Map<string, DataAsset>(assets.map((asset) => [asset.id, asset]));
  }, [assets]);

  const resolveIds = (ids: string[]) => ids.map((id) => assetMap.get(id)).filter(Boolean) as DataAsset[];

  return { assets, assetMap, resolveIds };
}
