"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Clock } from "lucide-react";

type PlanTask = {
  id: string;
  templateId: string;
  phase: string;
  name: string;
  durationHours: number;
  orderIndex: number;
};

type PlanTemplate = {
  id: string;
  name: string;
  description: string | null;
  tasks: PlanTask[];
};

function fmtDuration(hours: number) {
  if (hours < 24) return `${hours} 小時`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `${days} 天 ${rem} 小時` : `${days} 天`;
}

function TaskRow({ task, onUpdate, onDelete }: {
  task: PlanTask;
  onUpdate: (id: string, patch: Partial<PlanTask>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [phase, setPhase] = useState(task.phase);
  const [hours, setHours] = useState(String(task.durationHours));

  const save = async () => {
    await onUpdate(task.id, { name, phase, durationHours: parseInt(hours) || 1 });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <input value={phase} onChange={e => setPhase(e.target.value)} placeholder="階段"
          className="w-24 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
        <input value={name} onChange={e => setName(e.target.value)} placeholder="任務名稱"
          className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
        <div className="flex items-center gap-1">
          <input type="number" min="1" value={hours} onChange={e => setHours(e.target.value)}
            className="w-16 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400 text-center" />
          <span className="text-xs text-slate-500">小時</span>
        </div>
        <button onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg group">
      <span className="w-24 text-xs text-slate-400 truncate">{task.phase}</span>
      <span className="flex-1 text-sm text-slate-700">{task.name}</span>
      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium min-w-[72px]">
        <Clock className="w-3 h-3" />{fmtDuration(task.durationHours)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-blue-500 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function AddTaskForm({ templateId, onAdd }: { templateId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("");
  const [name, setName] = useState("");
  const [hours, setHours] = useState("1");

  const submit = async () => {
    if (!name.trim()) return;
    await fetch(`/api/plan-templates/${templateId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: phase.trim() || "未分類", name: name.trim(), durationHours: parseInt(hours) || 1 }),
    });
    setPhase(""); setName(""); setHours("1"); setOpen(false);
    onAdd();
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-lg w-full">
      <Plus className="w-3.5 h-3.5" /> 新增任務
    </button>
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <input value={phase} onChange={e => setPhase(e.target.value)} placeholder="階段（如：追蹤關懷）"
        className="w-28 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="任務名稱" autoFocus
        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
        onKeyDown={e => e.key === "Enter" && submit()} />
      <input type="number" min="1" value={hours} onChange={e => setHours(e.target.value)}
        className="w-16 text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400 text-center" />
      <span className="text-xs text-slate-500">小時</span>
      <button onClick={submit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function TemplateCard({ template, onRefresh }: { template: PlanTemplate; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(template.name);
  const [desc, setDesc] = useState(template.description ?? "");

  const totalHours = template.tasks.reduce((s, t) => s + t.durationHours, 0);

  const saveName = async () => {
    await fetch(`/api/plan-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    setEditingName(false);
    onRefresh();
  };

  const deleteTemplate = async () => {
    if (!confirm(`確定刪除「${template.name}」範本？`)) return;
    await fetch(`/api/plan-templates/${template.id}`, { method: "DELETE" });
    onRefresh();
  };

  const updateTask = async (taskId: string, patch: Partial<PlanTask>) => {
    await fetch(`/api/plan-templates/${template.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onRefresh();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/plan-templates/${template.id}/tasks/${taskId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <button onClick={() => setExpanded(v => !v)} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {editingName ? (
          <div className="flex-1 flex items-center gap-2">
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="flex-1 text-sm font-semibold border border-blue-300 rounded px-2 py-0.5 focus:outline-none" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="說明（選填）"
              className="w-48 text-xs border border-slate-300 rounded px-2 py-0.5 focus:outline-none" />
            <button onClick={saveName} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <span className="font-semibold text-slate-800 text-sm">{template.name}</span>
            {template.description && <span className="text-xs text-slate-400 truncate">{template.description}</span>}
            <span className="ml-auto text-xs text-slate-400">{template.tasks.length} 項任務・共 {fmtDuration(totalHours)}</span>
          </div>
        )}
        {!editingName && (
          <div className="flex gap-1">
            <button onClick={() => setEditingName(true)} className="p-1 text-slate-400 hover:text-blue-500 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={deleteTemplate} className="p-1 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Tasks */}
      {expanded && (
        <div className="px-2 py-2 space-y-1">
          {template.tasks.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">尚未新增任何任務</p>
          )}
          {template.tasks.map(task => (
            <TaskRow key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
          ))}
          <AddTaskForm templateId={template.id} onAdd={onRefresh} />
        </div>
      )}
    </div>
  );
}

export default function PlanTemplateManager() {
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch("/api/plan-templates");
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTemplate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/plan-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName(""); setAdding(false);
    load();
  };

  if (loading) return <div className="text-sm text-slate-400 py-4">載入中…</div>;

  return (
    <div className="space-y-4">
      {templates.map(t => (
        <TemplateCard key={t.id} template={t} onRefresh={load} />
      ))}

      {adding ? (
        <div className="flex items-center gap-2 p-3 border border-blue-200 bg-blue-50 rounded-xl">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="範本名稱（如：健康計畫）" autoFocus
            className="flex-1 text-sm border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-400"
            onKeyDown={e => e.key === "Enter" && addTemplate()} />
          <button onClick={addTemplate} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">新增</button>
          <button onClick={() => setAdding(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> 新增計畫範本
        </button>
      )}
    </div>
  );
}
