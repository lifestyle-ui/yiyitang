"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OptionRow = { id: string; category: string; label: string; sortOrder: number };

function StepList({ typeName }: { typeName: string }) {
  const cat = `cycleStep_${typeName}`;
  const [steps, setSteps] = useState<OptionRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = async () => {
    const res = await fetch(`/api/options?category=${encodeURIComponent(cat)}`);
    const data = await res.json();
    setSteps(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, [cat]);

  const add = async () => {
    if (!newLabel.trim()) return;
    await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, label: newLabel.trim(), sortOrder: steps.length }),
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

  const remove = async (id: string) => {
    if (!confirm("確定要刪除此步驟？")) return;
    await fetch(`/api/options/${id}`, { method: "DELETE" });
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
        <p className="text-xs text-slate-400 py-1">尚無步驟（點「新增步驟」加入）</p>
      )}
      <ul className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <li key={step.id} className="flex items-center gap-2 py-1">
            <span className="text-xs text-slate-400 w-4 flex-shrink-0">{i + 1}.</span>
            {editingId === step.id ? (
              <>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") save(step.id); if (e.key === "Escape") setEditingId(null); }}
                  className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none bg-white" autoFocus />
                <button onClick={() => save(step.id)} className="text-green-600 p-0.5"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingId(null)} className="text-slate-400 p-0.5"><X className="w-3 h-3" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-slate-700">{step.label}</span>
                <button onClick={() => { setEditingId(step.id); setEditLabel(step.label); }}
                  className="p-0.5 text-slate-300 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => remove(step.id)}
                  className="p-0.5 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </li>
        ))}
        {adding && (
          <li className="flex items-center gap-2 py-1">
            <span className="text-xs text-slate-400 w-4 flex-shrink-0">{steps.length + 1}.</span>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
              placeholder="步驟名稱..."
              className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none bg-white" autoFocus />
            <button onClick={add} className="text-green-600 p-0.5"><Check className="w-3 h-3" /></button>
            <button onClick={() => { setAdding(false); setNewLabel(""); }} className="text-slate-400 p-0.5"><X className="w-3 h-3" /></button>
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
    // Delete all steps for this type
    const res = await fetch(`/api/options?category=${encodeURIComponent(`cycleStep_${type.label}`)}`);
    const steps: OptionRow[] = await res.json();
    await Promise.all((steps || []).map((s) => fetch(`/api/options/${s.id}`, { method: "DELETE" })));
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
          <p className="text-xs text-slate-400 mt-0.5">新增週期類型並設定其預設步驟</p>
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
