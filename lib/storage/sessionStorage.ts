import type { SessionInput, SavedSession} from '../types';
import { savedSessionSchema } from '../types';
import { generateId } from '../id';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * LocalStorage key for storing all saved sessions
 */
const STORAGE_KEY = 'sc-payslip-sessions';

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
 * Saves or updates a session in localStorage.
 * If session has an ID, updates existing session. Otherwise creates new session.
 *
 * @param session - The session data to save
 * @returns StorageResult with the saved session data
 */
export function save(session: SessionInput): StorageResult<SavedSession> {
  try {
    // Get all existing sessions
    const sessions = getAllInternal();

    // Determine if this is a new session or an update
    const sessionId = session.id || generateId();
    const now = new Date().toISOString();

    // Find existing session if updating
    const existingIndex = sessions.findIndex((s) => s.id === sessionId);

    const savedSession: SavedSession = {
      id: sessionId,
      session: { ...session, id: sessionId },
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : now,
      updatedAt: now,
    };

    // Update or add session
    if (existingIndex >= 0) {
      sessions[existingIndex] = savedSession;
    } else {
      sessions.push(savedSession);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

    return {
      success: true,
      data: savedSession,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please export and delete old sessions.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save session',
    };
  }
}

/**
 * Retrieves all saved sessions from localStorage.
 * Validates each session with Zod schema and filters out corrupt data.
 * Returns sessions sorted by most recent first (updatedAt).
 *
 * @returns Array of validated SavedSession objects, sorted by most recent
 */
export function getAll(): SavedSession[] {
  return getAllInternal();
}

/**
 * Internal function to get all sessions with validation
 */
function getAllInternal(): SavedSession[] {
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

    // Validate each session and filter out invalid ones
    const validSessions: SavedSession[] = [];

    for (const item of parsed) {
      const result = savedSessionSchema.safeParse(item);
      if (result.success) {
        validSessions.push(result.data);
      }
    }

    // Sort by updatedAt (most recent first)
    return validSessions.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  } catch (_error) {
    // If localStorage is corrupt or unavailable, return empty array
    return [];
  }
}

/**
 * Deletes a session by ID from localStorage.
 *
 * @param sessionId - The ID of the session to delete
 * @returns StorageResult indicating success or failure
 */
export function deleteSession(sessionId: string): StorageResult<void> {
  try {
    const sessions = getAllInternal();

    // Filter out the session to delete
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);

    // Save updated list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session',
    };
  }
}

/**
 * Exports all sessions as a JSON string.
 * This can be used to create a backup file for users.
 *
 * @returns JSON string containing all saved sessions
 */
export function exportAll(): string {
  const sessions = getAllInternal();
  return JSON.stringify(sessions, null, 2);
}

/**
 * Imports sessions from a JSON string.
 * Validates the data and merges with existing sessions.
 * Regenerates IDs for imported sessions to prevent conflicts.
 *
 * @param jsonData - JSON string containing sessions to import
 * @returns StorageResult with count of successfully imported sessions
 */
export function importAll(jsonData: string): StorageResult<{ count: number }> {
  try {
    // Parse JSON
    const parsed = JSON.parse(jsonData);

    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: 'Invalid import data: expected an array of sessions',
      };
    }

    // Validate each session
    const validSessions: SavedSession[] = [];

    for (const item of parsed) {
      const result = savedSessionSchema.safeParse(item);
      if (result.success) {
        // Regenerate ID to prevent conflicts
        const newId = generateId();
        const newSession: SavedSession = {
          ...result.data,
          id: newId,
          session: {
            ...result.data.session,
            id: newId,
          },
        };
        validSessions.push(newSession);
      }
    }

    if (validSessions.length === 0) {
      return {
        success: false,
        error: 'No valid sessions found in import data',
      };
    }

    // Get existing sessions
    const existingSessions = getAllInternal();

    // Merge with existing sessions
    const allSessions = [...existingSessions, ...validSessions];

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));

    return {
      success: true,
      data: { count: validSessions.length },
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Invalid JSON format',
      };
    }
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please delete some sessions first.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import sessions',
    };
  }
}

/**
 * Duplicates an existing session with new IDs for all entities.
 * Creates a copy with "(Copy)" appended to the name.
 *
 * @param sessionId - The ID of the session to duplicate
 * @param copyExpenses - Whether to copy expenses to the new session (default: false)
 * @returns StorageResult with the duplicated session data
 *
 * @example
 * const result = duplicate("session-123", true);
 * if (result.success) {
 *   console.log(`Duplicated session: ${result.data.session.name}`);
 * }
 */
export function duplicate(
  sessionId: string,
  copyExpenses: boolean = false
): StorageResult<SavedSession> {
  try {
    // Get all existing sessions
    const sessions = getAllInternal();

    // Find the session to duplicate
    const originalSaved = sessions.find((s) => s.id === sessionId);

    if (!originalSaved) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    const original = originalSaved.session;

    // Generate new session ID
    const newSessionId = generateId();
    const now = new Date().toISOString();

    // Create new name with "(Copy)" suffix, truncate if needed
    const maxNameLength = 128;
    const copySuffix = ' (Copy)';
    let newName = original.name;
    if (newName.length + copySuffix.length > maxNameLength) {
      newName = newName.slice(0, maxNameLength - copySuffix.length);
    }
    newName = newName + copySuffix;

    // Create member ID mapping: oldId -> newId
    const memberIdMap = new Map<string, string>();
    const newMembers = original.members.map((member) => {
      const newMemberId = generateId();
      if (member.id) {
        memberIdMap.set(member.id, newMemberId);
      }
      return { ...member, id: newMemberId };
    });

    // Copy expenses if requested
    let newSharedExpenses = undefined;
    let newIndividualExpenses = undefined;

    if (copyExpenses) {
      // Copy shared expenses with new IDs (participantIds skipped for v1)
      if (original.sharedExpenses && original.sharedExpenses.length > 0) {
        newSharedExpenses = original.sharedExpenses.map((expense) => ({
          ...expense,
          id: generateId(),
          // Clear participantIds for v1 to avoid complex remapping
          participantIds: undefined,
        }));
      }

      // Copy individual expenses with new IDs and remapped memberIds
      if (original.individualExpenses && original.individualExpenses.length > 0) {
        newIndividualExpenses = original.individualExpenses.map((expense) => ({
          ...expense,
          id: generateId(),
          memberId: memberIdMap.get(expense.memberId) ?? expense.memberId,
        }));
      }
    }

    // Create the duplicated session
    const duplicatedSession = {
      id: newSessionId,
      name: newName,
      type: original.type,
      currency: original.currency,
      totalRevenue: original.totalRevenue,
      distributionMode: original.distributionMode,
      taxEnabled: original.taxEnabled,
      taxRate: original.taxRate,
      members: newMembers,
      sharedExpenses: newSharedExpenses,
      individualExpenses: newIndividualExpenses,
    };

    // Save the duplicated session
    const savedSession: SavedSession = {
      id: newSessionId,
      session: duplicatedSession,
      createdAt: now,
      updatedAt: now,
    };

    sessions.push(savedSession);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

    return {
      success: true,
      data: savedSession,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please export and delete old sessions.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate session',
    };
  }
}

/**
 * Clears all saved sessions from localStorage.
 * USE WITH CAUTION: This operation cannot be undone.
 *
 * @returns StorageResult indicating success or failure
 */
export function clearAll(): StorageResult<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear sessions',
    };
  }
}
