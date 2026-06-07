import {
  BLOCKUS_PACKAGE_MANAGER_STORAGE_KEY,
  PACKAGE_MANAGERS,
  type PackageManager,
} from '@/api/blockus';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT: PackageManager = 'pnpm';

function read(): PackageManager {
  try {
    const v = localStorage.getItem(BLOCKUS_PACKAGE_MANAGER_STORAGE_KEY);
    return v && (PACKAGE_MANAGERS as string[]).includes(v)
      ? (v as PackageManager)
      : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

// Persisted choice of package manager used to build block install commands.
export function usePackageManager() {
  const [packageManager, setState] = useState<PackageManager>(DEFAULT);

  useEffect(() => {
    setState(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOCKUS_PACKAGE_MANAGER_STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPackageManager = useCallback((pm: PackageManager) => {
    setState(pm);
    try {
      localStorage.setItem(BLOCKUS_PACKAGE_MANAGER_STORAGE_KEY, pm);
    } catch {
      // ignore persistence errors
    }
  }, []);

  return { packageManager, setPackageManager };
}
