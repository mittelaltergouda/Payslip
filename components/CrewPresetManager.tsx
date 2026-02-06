"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemberInput, DistributionMode, PresetMember, CrewPreset } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Local storage key for crew presets.
 */
const CREW_PRESETS_KEY = "sc-payslip-crew-presets";

/**
 * Props for the CrewPresetManager component.
 */
export interface CrewPresetManagerProps {
  /**
   * Whether the dialog is currently open.
   */
  isOpen: boolean;

  /**
   * Callback function called when the dialog should be closed.
   */
  onClose: () => void;

  /**
   * Current session members for saving as a preset.
   */
  currentMembers: MemberInput[];

  /**
   * Current distribution mode for the session.
   */
  currentDistributionMode: DistributionMode;

  /**
   * Callback function called when a preset is loaded.
   * Receives the preset members and optional distribution mode.
   */
  onLoadPreset: (members: PresetMember[], distributionMode?: DistributionMode) => void;

  /**
   * Current language for formatting.
   */
  lang: Lang;

  /**
   * Translation strings for the component.
   */
  translations: Record<string, string>;
}

/**
 * Loads crew presets from localStorage.
 * Returns an empty array if no presets are found or parsing fails.
 */
function loadPresetsFromStorage(): CrewPreset[] {
  if (typeof window === "undefined") {return [];}
  try {
    const stored = localStorage.getItem(CREW_PRESETS_KEY);
    if (!stored) {return [];}
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves crew presets to localStorage.
 */
function savePresetsToStorage(presets: CrewPreset[]): void {
  if (typeof window === "undefined") {return;}
  try {
    localStorage.setItem(CREW_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Extracts PresetMember data from MemberInput.
 */
function extractPresetMember(member: MemberInput): PresetMember {
  return {
    handle: member.handle,
    role: member.role,
    percentShare: member.percentShare,
  };
}

/**
 * Truncates a list of handles for display.
 */
function truncateHandles(members: PresetMember[], maxLength: number = 40): string {
  if (members.length === 0) {return "";}
  const handles = members.map((m) => m.handle).filter(Boolean);
  const joined = handles.join(", ");
  if (joined.length <= maxLength) {return joined;}
  return joined.substring(0, maxLength - 3) + "...";
}

/**
 * CrewPresetManager component displays a dialog for managing crew presets.
 * Users can save current crew as a preset, load, rename, or delete presets.
 *
 * @example
 * ```tsx
 * <CrewPresetManager
 *   isOpen={isPresetManagerOpen}
 *   onClose={() => setIsPresetManagerOpen(false)}
 *   currentMembers={members}
 *   currentDistributionMode={distributionMode}
 *   onLoadPreset={handleLoadPreset}
 *   lang="en"
 *   translations={t}
 * />
 * ```
 */
export function CrewPresetManager({
  isOpen,
  onClose,
  currentMembers,
  currentDistributionMode,
  onLoadPreset,
  lang,
  translations,
}: CrewPresetManagerProps) {
  const [presets, setPresets] = useState<CrewPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Load presets from storage on mount
  useEffect(() => {
    if (isOpen) {
      setPresets(loadPresetsFromStorage());
      // Reset state when dialog opens
      setNewPresetName("");
      setDeleteConfirmId(null);
      setEditingId(null);
      setEditingName("");
    }
  }, [isOpen]);

  // Handle saving a new preset
  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) {return;}
    if (currentMembers.length === 0) {return;}

    const presetMembers = currentMembers.map(extractPresetMember);
    const now = new Date().toISOString();
    const newPreset: CrewPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPresetName.trim(),
      members: presetMembers,
      distributionMode: currentDistributionMode,
      createdAt: now,
      updatedAt: now,
    };

    const updatedPresets = [newPreset, ...presets];
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    setNewPresetName("");
  }, [newPresetName, currentMembers, currentDistributionMode, presets]);

  // Handle loading a preset
  const handleLoadPreset = useCallback(
    (preset: CrewPreset) => {
      onLoadPreset(preset.members, preset.distributionMode);
      onClose();
    },
    [onLoadPreset, onClose]
  );

  // Handle delete button click - show confirmation
  const handleDeleteClick = useCallback((presetId: string) => {
    setDeleteConfirmId(presetId);
    // Cancel any active editing
    setEditingId(null);
    setEditingName("");
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(
    (presetId: string) => {
      const updatedPresets = presets.filter((p) => p.id !== presetId);
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setDeleteConfirmId(null);
    },
    [presets]
  );

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  // Handle starting edit mode
  const handleEditClick = useCallback((preset: CrewPreset) => {
    setEditingId(preset.id);
    setEditingName(preset.name);
    // Cancel any pending delete confirmation
    setDeleteConfirmId(null);
  }, []);

  // Handle saving edited name
  const handleEditSave = useCallback(
    (presetId: string) => {
      if (!editingName.trim()) {
        setEditingId(null);
        setEditingName("");
        return;
      }

      const updatedPresets = presets.map((p) => {
        if (p.id === presetId) {
          return {
            ...p,
            name: editingName.trim(),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setEditingId(null);
      setEditingName("");
    },
    [editingName, presets]
  );

  // Handle canceling edit mode
  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  // Handle key press in edit input
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, presetId: string) => {
      if (e.key === "Enter") {
        handleEditSave(presetId);
      } else if (e.key === "Escape") {
        handleEditCancel();
      }
    },
    [handleEditSave, handleEditCancel]
  );

  // Handle key press in new preset input
  const handleNewPresetKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSavePreset();
      }
    },
    [handleSavePreset]
  );

  // Format member count for display
  const formatMemberCount = (count: number): string => {
    const memberLabel = translations.presetMembers || (count === 1 ? "member" : "members");
    return `${count} ${memberLabel}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-neon">
            {translations.crewPresets || "Crew Presets"}
          </DialogTitle>
          <DialogDescription>
            {translations.managePresets || "Manage your saved crew configurations"}
          </DialogDescription>
        </DialogHeader>

        {/* Save Current Crew Section */}
        <div className="glass p-4 space-y-3">
          <h3 className="text-sm font-semibold text-sand">
            {translations.saveCurrentCrew || "Save Current Crew"}
          </h3>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={handleNewPresetKeyDown}
              placeholder={translations.presetNamePlaceholder || "Enter preset name"}
              className="flex-1"
              disabled={currentMembers.length === 0}
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSavePreset}
              disabled={!newPresetName.trim() || currentMembers.length === 0}
            >
              {translations.saveCrewPreset || "Save"}
            </Button>
          </div>
          {currentMembers.length === 0 && (
            <p className="text-xs text-white/50">
              {lang === "de"
                ? "Füge zuerst Mitglieder hinzu, um eine Vorlage zu speichern."
                : "Add members first to save a preset."}
            </p>
          )}
        </div>

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {presets.length === 0 ? (
            <div className="glass p-6 text-center">
              <p className="text-white/60">
                {translations.noPresets || "No saved presets"}
              </p>
            </div>
          ) : (
            presets.map((preset) => (
              <div key={preset.id} className="glass p-4 space-y-3">
                {/* Preset Info */}
                {editingId === preset.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, preset.id)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSave(preset.id)}
                      aria-label="Save name"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCancel}
                      aria-label="Cancel"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sand text-lg truncate">
                        {preset.name}
                      </h3>
                      <button
                        onClick={() => handleEditClick(preset)}
                        className="p-1 rounded hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0"
                        aria-label="Edit name"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      <p>{formatMemberCount(preset.members.length)}</p>
                      <p className="truncate">{truncateHandles(preset.members)}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {deleteConfirmId === preset.id ? (
                  <div className="space-y-2">
                    <p className="text-sm text-white/80">
                      {translations.confirmDeletePreset || "Delete this preset?"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteConfirm(preset.id)}
                      >
                        {translations.deleteSession || "Delete"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={handleDeleteCancel}
                      >
                        {translations.cancel || "Cancel"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {translations.loadCrewPreset || "Load"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(preset.id)}
                      aria-label="Delete preset"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
