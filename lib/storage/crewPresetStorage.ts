import type { CrewPreset, PresetMember, DistributionMode } from '../types';
import { crewPresetSchema } from '../types';
import { generateId } from '../id';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * LocalStorage key for storing all saved crew presets
 */
const STORAGE_KEY = 'sc-payslip-crew-presets';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result type for operations that can fail
 */
type StorageResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Saves a new crew preset to localStorage.
 * Creates a new preset with a generated ID and timestamps.
 *
 * @param name - The display name for the preset
 * @param members - Array of preset members (handle and role only)
 * @param distributionMode - Optional distribution mode to save with the preset
 * @returns StorageResult with the saved CrewPreset data
 */
export function savePreset(
  name: string,
  members: PresetMember[],
  distributionMode?: DistributionMode,
): StorageResult<CrewPreset> {
  try {
    // Get all existing presets
    const presets = getAllInternal();

    const presetId = generateId();
    const now = new Date().toISOString();

    const preset: CrewPreset = {
      id: presetId,
      name,
      members,
      distributionMode,
      createdAt: now,
      updatedAt: now,
    };

    // Add new preset
    presets.push(preset);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

    return {
      success: true,
      data: preset,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please delete old presets.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save preset',
    };
  }
}

/**
 * Retrieves all saved crew presets from localStorage.
 * Validates each preset with Zod schema and filters out corrupt data.
 * Returns presets sorted by most recent first (updatedAt).
 *
 * @returns Array of validated CrewPreset objects, sorted by most recent
 */
export function getAllPresets(): CrewPreset[] {
  return getAllInternal();
}

/**
 * Internal function to get all presets with validation
 */
function getAllInternal(): CrewPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    // Parse JSON
    const parsed = JSON.parse(data);

    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate each preset and filter out invalid ones
    const validPresets: CrewPreset[] = [];

    for (const item of parsed) {
      const result = crewPresetSchema.safeParse(item);
      if (result.success) {
        validPresets.push(result.data);
      }
    }

    // Sort by updatedAt (most recent first)
    return validPresets.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  } catch (_error) {
    // If localStorage is corrupt or unavailable, return empty array
    return [];
  }
}

/**
 * Deletes a crew preset by ID from localStorage.
 *
 * @param presetId - The ID of the preset to delete
 * @returns StorageResult indicating success or failure
 */
export function deletePreset(presetId: string): StorageResult<void> {
  try {
    const presets = getAllInternal();

    // Filter out the preset to delete
    const updatedPresets = presets.filter((p) => p.id !== presetId);

    // Save updated list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete preset',
    };
  }
}

/**
 * Updates an existing crew preset by ID.
 * Supports partial updates via a patch object (name and/or members).
 *
 * @param presetId - The ID of the preset to update
 * @param patch - Object containing fields to update (name and/or members)
 * @returns StorageResult with the updated CrewPreset data
 */
export function updatePreset(
  presetId: string,
  patch: { name?: string; members?: PresetMember[] },
): StorageResult<CrewPreset> {
  try {
    const presets = getAllInternal();

    // Find existing preset
    const existingIndex = presets.findIndex((p) => p.id === presetId);

    if (existingIndex < 0) {
      return {
        success: false,
        error: 'Preset not found',
      };
    }

    const existing = presets[existingIndex];
    const now = new Date().toISOString();

    // Apply patch
    const updatedPreset: CrewPreset = {
      ...existing,
      name: patch.name ?? existing.name,
      members: patch.members ?? existing.members,
      updatedAt: now,
    };

    // Replace in array
    presets[existingIndex] = updatedPreset;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

    return {
      success: true,
      data: updatedPreset,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please delete old presets.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preset',
    };
  }
}
