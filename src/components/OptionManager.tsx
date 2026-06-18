"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { id: string; category: string; label: string; sortOrder: number };

export default function OptionManager({ category, title }: { category: string; title: string }) {
  const [options, setOptions] = useState<Option[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const fetch_ = async () => {
    const res = await fetch(`/api/options?category=${category}`);
    const data = await res.json();
    setOptions(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetch_(); }, [category]);

  const add = async () => {
    if (!newLabel.trim()) return;
    await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, label: newLabel.trim(), sortOrder: options.length }),
    });
    setNewLabel(""); setAdding(false); fetch_();
  };

  const save = async (id: string) => {
    if (!editLabel.trim()) return;
    await fetch(`/api/options/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim() }),
    });
    setEditingId(null); fetch_();
  };

  const remove = async (id: string) => {
    if (!confirm("確定要刪除這個選項嗎？")) return;
    await fetch(`/api/options/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" onClick={() => setAdding(true)} variant="secondary">
          <Plus className="w-3.5 h-3.5" />新增
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {options.map((opt) => (
            <li key={opt.id} className="flex items-center gap-2 px-4 py-2.5">
              <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              {editingId === opt.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") save(opt.id); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                  <button onClick={() => save(opt.id)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{opt.label}</span>
                  <button onClick={() => { setEditingId(opt.id); setEditLabel(opt.label); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(opt.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </li>
          ))}
          {adding && (
            <li className="flex items-center gap-2 px-4 py-2.5 bg-blue-50">
              <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
                placeholder="輸入選項名稱..."
                className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                autoFocus
              />
              <button onClick={add} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setAdding(false); setNewLabel(""); }} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-3.5 h-3.5" /></button>
            </li>
          )}
          {options.length === 0 && !adding && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">尚無選項，點「新增」加入</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
