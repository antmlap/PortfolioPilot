"use client";

import { useState } from "react";
import {
  ADVISORS,
  ADVISOR_IDS,
  CUSTOM_ADVISOR_DEFAULTS,
  type AdvisorId,
  type CustomAdvisor,
} from "@/lib/advisors";
import { ChevronDown, ChevronUp, Plus, UserPlus, Pencil, Trash2, X } from "lucide-react";
import clsx from "clsx";

const accentBorder: Record<string, string> = {
  buffett: "border-l-orange",
  lynch: "border-l-emerald-500",
  dalio: "border-l-accent",
  graham: "border-l-amber-600",
  wood: "border-l-rose-500",
};

function getAccentBorder(id: string): string {
  if (id in accentBorder) return accentBorder[id];
  return "border-l-violet-500";
}

interface SelectAdvisorsProps {
  selectedIds?: AdvisorId[];
  customAdvisors?: CustomAdvisor[];
  instructionOverrides?: Record<string, string>;
  onSelectionChange?: (ids: AdvisorId[]) => void;
  onCustomAdvisorsChange?: (advisors: CustomAdvisor[]) => void;
  onInstructionOverride?: (id: string, instructions: string | null) => void;
}

export function SelectAdvisors({
  selectedIds = [],
  customAdvisors = [],
  instructionOverrides = {},
  onSelectionChange,
  onCustomAdvisorsChange,
  onInstructionOverride,
}: SelectAdvisorsProps) {
  const selectedSet = new Set(selectedIds);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [showAddBuiltIn, setShowAddBuiltIn] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustom, setNewCustom] = useState<CustomAdvisor>(() => ({
    ...CUSTOM_ADVISOR_DEFAULTS,
    id: `custom-${Date.now()}`,
  }));

  const builtInSelected = ADVISOR_IDS.filter((id) => selectedSet.has(id));
  const displayList: Array<{ id: string; name: string; title: string; tagline: string; avatar: string; instructions: string; isCustom: boolean }> = [
    ...builtInSelected.map((id) => {
      const a = ADVISORS[id];
      const instructions = instructionOverrides[a.id] ?? a.instructions;
      return {
        id: a.id,
        name: a.name,
        title: a.title,
        tagline: a.tagline,
        avatar: a.avatar,
        instructions,
        isCustom: false,
      };
    }),
    ...customAdvisors.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      tagline: c.tagline,
      avatar: c.avatar,
      instructions: c.instructions,
      isCustom: true,
    })),
  ];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const startEdit = (id: string, currentInstructions: string) => {
    setEditingId(id);
    setEditInstructions(currentInstructions);
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const isCustom = customAdvisors.some((c) => c.id === editingId);
    if (isCustom && onCustomAdvisorsChange) {
      const updated = customAdvisors.map((c) =>
        c.id === editingId ? { ...c, instructions: editInstructions } : c
      );
      onCustomAdvisorsChange(updated);
    } else if (onInstructionOverride) {
      onInstructionOverride(editingId, editInstructions || null);
    }
    setEditingId(null);
    setEditInstructions("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditInstructions("");
  };

  const removeAdvisor = (id: string) => {
    const isCustom = customAdvisors.some((c) => c.id === id);
    if (isCustom && onCustomAdvisorsChange) {
      onCustomAdvisorsChange(customAdvisors.filter((c) => c.id !== id));
    } else if (onSelectionChange && ADVISOR_IDS.includes(id as AdvisorId)) {
      const next = selectedIds.filter((x) => x !== id);
      if (next.length >= 1) onSelectionChange(next);
    }
  };

  const addBuiltIn = (id: AdvisorId) => {
    if (onSelectionChange && !selectedSet.has(id)) {
      onSelectionChange([...selectedIds, id]);
      setShowAddBuiltIn(false);
    }
  };

  const addCustomAdvisor = () => {
    const name = newCustom.name.trim();
    const instructions = newCustom.instructions.trim();
    if (!name || !instructions) return;
    const custom: CustomAdvisor = {
      ...newCustom,
      id: `custom-${Date.now()}`,
      name,
      instructions,
      title: newCustom.title.trim() || CUSTOM_ADVISOR_DEFAULTS.title,
      tagline: newCustom.tagline.trim() || CUSTOM_ADVISOR_DEFAULTS.tagline,
    };
    onCustomAdvisorsChange?.([...customAdvisors, custom]);
    setNewCustom({ ...CUSTOM_ADVISOR_DEFAULTS, id: `custom-${Date.now()}` });
    setShowAddCustom(false);
  };

  const availableBuiltIn = ADVISOR_IDS.filter((id) => !selectedSet.has(id));

  return (
    <section
      id="select-advisors"
      className="rounded-lg border-2 border-orange bg-orange-mute p-8 scroll-mt-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink mb-2">
        Your advisors
      </h2>
      <p className="text-sm text-mute mb-6 max-w-xl">
        Only the advisors below take part in the discussion. Edit instructions,
        add a built-in advisor, or add your own. Changes apply when you run a
        new analysis.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setShowAddBuiltIn(true); setShowAddCustom(false); }}
          disabled={availableBuiltIn.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-paper border border-border text-sm font-medium text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add advisor
        </button>
        <button
          type="button"
          onClick={() => { setShowAddCustom((v) => !v); setShowAddBuiltIn(false); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-paper border border-border text-sm font-medium text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <UserPlus className="w-4 h-4" />
          Add your own advisor
        </button>
      </div>

      {showAddBuiltIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-advisor-title"
          onClick={(e) => e.target === e.currentTarget && setShowAddBuiltIn(false)}
        >
          <div
            className="bg-paper rounded-xl border-2 border-orange shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="add-advisor-title" className="font-display text-lg font-semibold text-ink">
                Select a pre-made advisor
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBuiltIn(false)}
                className="p-2 rounded-md text-mute hover:text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {availableBuiltIn.length === 0 ? (
                <p className="text-mute text-sm py-4 text-center">
                  All pre-made advisors are already added. Add your own with &quot;Add your own advisor&quot;.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableBuiltIn.map((id) => {
                    const a = ADVISORS[id];
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => addBuiltIn(id)}
                        className={clsx(
                          "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors",
                          "border-border hover:border-accent hover:bg-orange-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
                          getAccentBorder(a.id)
                        )}
                      >
                        <span className="text-2xl shrink-0">{a.avatar}</span>
                        <div className="min-w-0">
                          <div className="font-medium text-ink text-sm">{a.name}</div>
                          <div className="text-xs text-mute mt-0.5">{a.title}</div>
                          <div className="text-xs text-mute mt-1">{a.tagline}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddCustom && (
        <div className="mb-6 p-4 rounded-lg bg-paper/80 border border-border space-y-3">
          <p className="text-xs font-medium text-mute uppercase tracking-wider">
            New custom advisor
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={newCustom.name}
              onChange={(e) => setNewCustom((c) => ({ ...c, name: e.target.value }))}
              placeholder="Name"
              className="px-3 py-2 rounded-md border border-border text-sm"
            />
            <input
              type="text"
              value={newCustom.title}
              onChange={(e) => setNewCustom((c) => ({ ...c, title: e.target.value }))}
              placeholder="Title (e.g. Growth investor)"
              className="px-3 py-2 rounded-md border border-border text-sm"
            />
          </div>
          <textarea
            value={newCustom.instructions}
            onChange={(e) => setNewCustom((c) => ({ ...c, instructions: e.target.value }))}
            placeholder="Instructions for the AI (how this advisor should think and respond)"
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-border text-sm font-sans"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustomAdvisor}
              disabled={!newCustom.name.trim() || !newCustom.instructions.trim()}
              className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
            >
              Add advisor
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-4 py-2 rounded-md border border-border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {displayList.length === 0 ? (
        <p className="text-mute text-sm py-4">
          No advisors selected. Add one above to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((a) => {
            const isExpanded = expandedId === a.id;
            const isEditing = editingId === a.id;
            return (
              <div
                key={a.id}
                className={clsx(
                  "rounded-lg border-l-4 bg-paper/50 border-border overflow-hidden",
                  getAccentBorder(a.id)
                )}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl mb-1">{a.avatar}</div>
                      <h3 className="font-medium text-ink text-sm">{a.name}</h3>
                      <p className="text-xs text-mute">{a.title}</p>
                      <p className="text-xs text-mute mt-1">{a.tagline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(a.id)}
                          className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>Hide instructions <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Show instructions <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(a.id, a.instructions)}
                          className="text-xs font-medium text-mute hover:text-ink flex items-center gap-1"
                          title="Edit instructions"
                        >
                          <Pencil className="w-3 h-3" /> Edit instructions
                        </button>
                        {displayList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAdvisor(a.id)}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            title="Remove advisor"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && !isEditing && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-mute whitespace-pre-wrap font-sans">
                        {a.instructions}
                      </p>
                    </div>
                  )}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <label className="text-xs font-medium text-mute block mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 rounded-md border border-border text-xs font-sans text-ink"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-md border border-border text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
