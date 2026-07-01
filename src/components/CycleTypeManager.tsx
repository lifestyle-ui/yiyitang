"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, GripVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OptionRow = { id: string; category: string; label: string; sortOrder: number };

type CycleStep = {
  id: string;
  cycleType: string;
  label: string;
  sortOrder: number;
  role: string | null;
  deliverable: string | null;
  isKeyOutput: boolean;
  defaultOffset: string | null;
  hasDueTracking: boolean;
};

const ROLES = ["", "醫師", "健管師", "助理", "客戶"];
const ROLE_COLORS: Record<string, string> = {
  "醫師": "bg-purple-100 text-purple-700",
  "健管師": "bg-blue-100 text-blue-700",
  "助理": "bg-amber-100 text-amber-700",
  "客戶": "bg-green-100 text-green-700",
};

function StepEditRow({ step, onSave, onCancel }: {
  step: Partial<CycleStep> & { label: string };
  onSave: (patch: Omit<CycleStep, "id" | "cycleType" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(step.label);
  const [role, setRole] = useState(step.role ?? "");
  const [deliverable, setDeliverable] = useState(step.deliverable ?? "");
  const [isKeyOutput, setIsKeyOutput] = useState(step.isKeyOutput ?? false);
  const [defaultOffset, setDefaultOffset] = useState(step.defaultOffset ?? "");
  const [hasDueTracking, setHasDueTracking] = useState(step.hasDueTracking ?? false);

  const isHeader = label.startsWith("§ ");

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
      <div className="flex gap-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="步驟名稱（§ 開頭為分組標題）"
          className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-400 bg-white" autoFocus />
        {!isHeader && (
          <select value={role} onChange={e => setRole(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-400 bg-white">
            <option value="">— 負責人 —</option>
            {ROLES.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>
      {!isHeader && (
        <div className="flex gap-2 flex-wrap">
          <input value={deliverable} onChange={e => setDeliverable(e.target.value)} placeholder="交付物（如：諮詢記錄、後續計畫）"
            className="flex-1 min-w-[160px] text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-400 bg-white" />
          <input value={defaultOffset} onChange={e => setDefaultOffset(e.target.value)} placeholder="時距（如：+2d、+1w）"
            className="w-32 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-400 bg-white" />
          <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={isKeyOutput} onChange={e => setIsKeyOutput(e.target.checked)} className="w-3 h-3" />
            ★ 關鍵交付
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={hasDueTracking} onChange={e => setHasDueTracking(e.target.checked)} className="w-3 h-3" />
            追蹤到期
          </label>
        </div>
      )}
      <div className="flex gap-1 justify-end">
        <button onClick={() => onSave({ label, sortOrder: step.sortOrder ?? 0, role: role || null, deliverable: deliverable || null, isKeyOutput, defaultOffset: defaultOffset || null, hasDueTracking })}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
          <Check className="w-3 h-3" />儲存
        </button>
        <button onClick={onCancel} className="px-2 py-1 text-xs bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50">
          取消
        </button>
      </div>
    </div>
  );
}

function StepList({ typeName }: { typeName: string }) {
  const [steps, setSteps] = useState<CycleStep[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/cycle-type-steps?cycleType=${encodeURIComponent(typeName)}`);
    const data = await res.json();
    setSteps(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, [typeName]);

  const add = async (patch: Omit<CycleStep, "id" | "cycleType" | "createdAt" | "updatedAt">) => {
    await fetch("/api/cycle-type-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleType: typeName, ...patch }),
    });
    setAdding(false);
    load();
  };

  const save = async (id: string, patch: Omit<CycleStep, "id" | "cycleType" | "createdAt" | "updatedAt">) => {
    await fetch(`/api/cycle-type-steps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定要刪除此步驟？")) return;
    await fetch(`/api/cycle-type-steps/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500">預設步驟</p>
        <button onClick={() => setAdding(true)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Plus className="w-3 h-3" />新增步驟
        </button>
      </div>
      {steps.length === 0 && !adding && (
        <p className="text-xs text-slate-400 py-1">尚無步驟（點「新增步驟」加入，或新建週期時將使用系統預設步驟）</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const isHeader = step.label.startsWith("§ ");
          if (editingId === step.id) {
            return (
              <li key={step.id}>
                <StepEditRow
                  step={step}
                  onSave={(patch) => save(step.id, patch)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            );
          }
          return (
            <li key={step.id} className={`flex items-center gap-2 py-1 px-2 rounded group ${isHeader ? "bg-slate-100" : "hover:bg-white"}`}>
              <span className="text-xs text-slate-400 w-4 flex-shrink-0 text-right">{isHeader ? "" : `${i + 1}.`}</span>
              {isHeader ? (
                <span className="flex-1 text-xs font-semibold text-slate-500">{step.label.slice(2)}</span>
              ) : (
                <>
                  {step.isKeyOutput && <Star className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />}
                  <span className="flex-1 text-xs text-slate-700">{step.label}</span>
                  {step.role && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[step.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {step.role}
                    </span>
                  )}
                  {step.deliverable && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px] flex-shrink-0" title={step.deliverable}>
                      📄{step.deliverable}
                    </span>
                  )}
                  {step.hasDueTracking && <span className="text-[10px] text-orange-400 flex-shrink-0">⏰</span>}
                </>
              )}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => setEditingId(step.id)} className="p-0.5 text-slate-300 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => remove(step.id)} className="p-0.5 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </li>
          );
        })}
        {adding && (
          <li>
            <StepEditRow
              step={{ label: "", sortOrder: steps.length }}
              onSave={add}
              onCancel={() => setAdding(false)}
            />
          </li>
        )}
      </ul>
    </div>
  );
}

export default function CycleTypeManager() {
  const [types, setTypes] = useState<OptionRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = async () => {
    const res = await fetch("/api/options?category=cycleType");
    const data = await res.json();
    setTypes(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newLabel.trim()) return;
    await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "cycleType", label: newLabel.trim(), sortOrder: types.length }),
    });
    setNewLabel(""); setAdding(false); load();
  };

  const save = async (id: string) => {
    if (!editLabel.trim()) return;
    await fetch(`/api/options/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim() }),
    });
    setEditingId(null); load();
  };

  const remove = async (type: OptionRow) => {
    if (!confirm(`確定要刪除「${type.label}」週期類型及其所有步驟嗎？`)) return;
    // Delete CycleTypeStep entries
    const res = await fetch(`/api/cycle-type-steps?cycleType=${encodeURIComponent(type.label)}`);
    const steps: CycleStep[] = await res.json();
    await Promise.all((steps || []).map((s) => fetch(`/api/cycle-type-steps/${s.id}`, { method: "DELETE" })));
    // Delete legacy OptionConfig steps
    const legacyRes = await fetch(`/api/options?category=${encodeURIComponent(`cycleStep_${type.label}`)}`);
    const legacySteps: OptionRow[] = await legacyRes.json();
    await Promise.all((legacySteps || []).map((s) => fetch(`/api/options/${s.id}`, { method: "DELETE" })));
    await fetch(`/api/options/${type.id}`, { method: "DELETE" });
    load();
  };

  const toggle = (id: string) => setExpanded((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">診療週期類型</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">新增週期類型並設定預設步驟（★ 關鍵交付・⏰ 到期追蹤）</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} variant="secondary">
          <Plus className="w-3.5 h-3.5" />新增類型
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {types.map((type) => (
            <li key={type.id}>
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => toggle(type.id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  {expanded.has(type.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                {editingId === type.id ? (
                  <>
                    <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") save(type.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none bg-white" autoFocus />
                    <button onClick={() => save(type.id)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 p-1"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-700 cursor-pointer" onClick={() => toggle(type.id)}>{type.label}</span>
                    <button onClick={() => { setEditingId(type.id); setEditLabel(type.label); }}
                      className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(type)}
                      className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
              {expanded.has(type.id) && <StepList typeName={type.label} />}
            </li>
          ))}
          {adding && (
            <li className="flex items-center gap-2 px-4 py-3 bg-blue-50">
              <span className="w-4 flex-shrink-0" />
              <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
                placeholder="輸入週期類型名稱（例如：睡眠評估）"
                className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none bg-white" autoFocus />
              <button onClick={add} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setAdding(false); setNewLabel(""); }} className="text-slate-400 p-1"><X className="w-3.5 h-3.5" /></button>
            </li>
          )}
          {types.length === 0 && !adding && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">尚無週期類型，點「新增類型」加入</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
