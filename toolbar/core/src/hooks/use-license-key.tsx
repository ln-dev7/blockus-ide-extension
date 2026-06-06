import { useCallback, useEffect, useState } from 'react';
import {
  BLOCKUS_API_KEY_STORAGE_KEY,
  isValidApiKeyFormat,
  validateApiKey,
} from '@/api/blockus';

// blockus API key state. The key (bk_live_…) is what unlocks Pro blocks.
// We keep the historical `useLicenseKey` name + shape so existing consumers
// (settings panel, blocks list, chat) keep working without changes.

interface LicenseKeyState {
  licenseKey: string | null;
  isProUser: boolean;
  isValidated: boolean;
  lastValidated: Date | null;
}

export function useLicenseKey() {
  const [licenseState, setLicenseState] = useState<LicenseKeyState>({
    licenseKey: null,
    isProUser: false,
    isValidated: false,
    lastValidated: null,
  });

  const loadLicenseKey = useCallback(async () => {
    try {
      const storedData = localStorage.getItem(BLOCKUS_API_KEY_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setLicenseState({
          licenseKey: parsed.licenseKey,
          isProUser: parsed.isValidated === true,
          isValidated: parsed.isValidated === true,
          lastValidated: parsed.lastValidated
            ? new Date(parsed.lastValidated)
            : null,
        });
      }
    } catch (error) {
      console.warn('Failed to load blockus API key from storage:', error);
      // Clear invalid stored data
      localStorage.removeItem(BLOCKUS_API_KEY_STORAGE_KEY);
    }
  }, []);

  // Load key from storage on mount
  useEffect(() => {
    loadLicenseKey();

    // Listen for storage changes (from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BLOCKUS_API_KEY_STORAGE_KEY) {
        loadLicenseKey();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLicenseKey]);

  const validateLicenseKey = useCallback(
    async (key: string): Promise<boolean> => {
      if (!key || typeof key !== 'string') {
        return false;
      }
      const trimmed = key.trim();
      if (!isValidApiKeyFormat(trimmed)) {
        return false;
      }
      // A key is "valid" when the blockus catalog reports it unlocks Pro.
      return validateApiKey(trimmed);
    },
    [],
  );

  const saveLicenseKey = useCallback(
    async (key: string): Promise<void> => {
      // blockus keys are case-sensitive (base64url) — never uppercase them.
      const trimmedKey = key.trim();

      if (!isValidApiKeyFormat(trimmedKey)) {
        throw new Error('Invalid API key. Keys start with "bk_live_".');
      }

      const isValid = await validateLicenseKey(trimmedKey);

      if (!isValid) {
        throw new Error('Invalid or non-Pro API key');
      }

      const licenseData = {
        licenseKey: trimmedKey,
        isValidated: true,
        lastValidated: new Date().toISOString(),
      };

      try {
        localStorage.setItem(
          BLOCKUS_API_KEY_STORAGE_KEY,
          JSON.stringify(licenseData),
        );

        setLicenseState({
          licenseKey: trimmedKey,
          isProUser: true,
          isValidated: true,
          lastValidated: new Date(),
        });

        // Trigger a storage event for other components/tabs to sync
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: BLOCKUS_API_KEY_STORAGE_KEY,
            newValue: JSON.stringify(licenseData),
            storageArea: localStorage,
          }),
        );
      } catch (error) {
        console.error('Failed to save blockus API key:', error);
        throw new Error('Failed to save API key');
      }
    },
    [validateLicenseKey],
  );

  const removeLicenseKey = useCallback(() => {
    try {
      localStorage.removeItem(BLOCKUS_API_KEY_STORAGE_KEY);
      setLicenseState({
        licenseKey: null,
        isProUser: false,
        isValidated: false,
        lastValidated: null,
      });

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: BLOCKUS_API_KEY_STORAGE_KEY,
          newValue: null,
          storageArea: localStorage,
        }),
      );
    } catch (error) {
      console.error('Failed to remove blockus API key:', error);
      throw new Error('Failed to remove API key');
    }
  }, []);

  const refreshLicenseValidation = useCallback(async (): Promise<boolean> => {
    if (!licenseState.licenseKey) {
      return false;
    }

    try {
      const isValid = await validateLicenseKey(licenseState.licenseKey);

      if (isValid) {
        const licenseData = {
          licenseKey: licenseState.licenseKey,
          isValidated: true,
          lastValidated: new Date().toISOString(),
        };

        localStorage.setItem(
          BLOCKUS_API_KEY_STORAGE_KEY,
          JSON.stringify(licenseData),
        );

        setLicenseState((prev) => ({
          ...prev,
          isProUser: true,
          isValidated: true,
          lastValidated: new Date(),
        }));
      } else {
        // Key is no longer valid, remove it
        removeLicenseKey();
      }

      return isValid;
    } catch (error) {
      console.error('Failed to refresh API key validation:', error);
      return false;
    }
  }, [licenseState.licenseKey, validateLicenseKey, removeLicenseKey]);

  // Helper to check if key needs revalidation (e.g., every 24 hours)
  const needsRevalidation = useCallback((): boolean => {
    if (!licenseState.lastValidated) {
      return true;
    }

    const hoursSinceLastValidation =
      (Date.now() - licenseState.lastValidated.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastValidation > 24; // Revalidate every 24 hours
  }, [licenseState.lastValidated]);

  return {
    // State
    licenseKey: licenseState.licenseKey,
    isProUser: licenseState.isProUser,
    isValidated: licenseState.isValidated,
    lastValidated: licenseState.lastValidated,

    // Actions
    saveLicenseKey,
    removeLicenseKey,
    validateLicenseKey,
    refreshLicenseValidation,
    needsRevalidation,
    loadLicenseKey,
  };
}
