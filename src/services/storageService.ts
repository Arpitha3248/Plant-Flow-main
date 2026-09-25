import type { Plant } from '../types/plant';
import { INITIAL_PLANTS } from '../data/cementPlantDemo';
import { validatePlantsStorage } from '../utils/plantValidation';

// ---- Storage key helpers ---------------------------------------------------
// Admin users see ALL plants across a shared key.
// Each operator gets their own namespaced key so their changes
// are isolated from other operators and from the admin view.
// Admin key is the legacy key to preserve existing data.

const ADMIN_STORAGE_KEY = 'plant_designer_plants';

function operatorKey(userId: string): string {
  return `plant_designer_plants_${userId}`;
}

/** Returns the storage key for the given userId.
 *  Admins share the global key; operators get a per-user namespace. */
function storageKeyForUser(userId?: string, role?: string): string {
  if (!userId || role === 'ADMIN') return ADMIN_STORAGE_KEY;
  return operatorKey(userId);
}

// ---- Core read/write -------------------------------------------------------
function readFromStorage(key: string): Record<string, Plant> {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const validated = validatePlantsStorage(parsed);
      if (validated) return validated;
      console.warn(`storageService: validation failed for key "${key}", reverting to demo.`);
    }
  } catch (e) {
    console.error('storageService: failed to load plants:', e);
  }
  return INITIAL_PLANTS;
}

function writeToStorage(key: string, plants: Record<string, Plant>): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(plants));
    return true;
  } catch (e) {
    console.error('storageService: failed to save plants:', e);
    return false;
  }
}

// ---- Public API ------------------------------------------------------------

export const storageService = {
  // ---- Legacy API (no auth context — used by bare usePlantState) -----------
  loadPlants(): Record<string, Plant> {
    return readFromStorage(ADMIN_STORAGE_KEY);
  },

  savePlants(plants: Record<string, Plant>): boolean {
    return writeToStorage(ADMIN_STORAGE_KEY, plants);
  },

  clearStorage(): void {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (e) {
      console.error('storageService: failed to clear storage:', e);
    }
  },

  // ---- Auth-aware API (used by authenticated PlantFlow) --------------------
  loadPlantsForUser(userId: string, role: string): Record<string, Plant> {
    return readFromStorage(storageKeyForUser(userId, role));
  },

  savePlantsForUser(userId: string, role: string, plants: Record<string, Plant>): boolean {
    return writeToStorage(storageKeyForUser(userId, role), plants);
  },

  clearStorageForUser(userId: string, role: string): void {
    try {
      localStorage.removeItem(storageKeyForUser(userId, role));
    } catch (e) {
      console.error('storageService: failed to clear user storage:', e);
    }
  },
};
