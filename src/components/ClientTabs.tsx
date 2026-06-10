"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, FlaskConical, Pill, ClipboardList,
  MessageCircle, Stethoscope, Plus, X, ChevronDown, ChevronRight,
  Pencil, Trash2, Calendar,
} from "lucide-react";
import { cn, formatDate, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type Client = {
  id: string; name: string;
  consultations: Consultation[]; labTests: LabTest[];
  prescriptions: Prescription[]; tasks: Task[];
  lineTrackings: LineTracking[]; doctorNotes: DoctorNote[];
  healthPlans: unknown[];
};
type Consultation = { id: string; date: string; chiefComplaint: string | null; content: string | null; doctorAdvice: string | null; nextSteps: string | null; };
type LabTest = { id: string; testDate: string | null; testType: string; status: string; findings: string | null; doctorInterpretation: string | null; staffExplanation: string | null; };
type Prescription = { id: string; date: string; items: unknown; totalDays: number | null; runOutDate: string | null; status: string; notes: string | null; };
type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: string; status: string; category: string | null; assignedTo: string | null; };
type LineTracking = { id: string; date: string; content: string; response: string | null; followUpNeeded: boolean; };
type DoctorNote = { id: string; date: string; diagnosis: string | null; treatment: string | null; notes: string | null; nextVisit: string | null; };
type Product = { id: string; name: string; category: string | null; brand: string | null; spec: string | null; dosage: string | null; unit: string; };
type TestItem = { id: string; name: string; category: string | null; code: string | null; turnaround: string | null; };

const TABS = [
  { key: "consultations", label: "諮詢記錄", icon: MessageSquare },
  { key: "doctorNotes", label: "醫師處置", icon: Stethoscope },
  { key: "labTests", label: "檢測", icon: FlaskConical },
  { key: "prescriptions", label: "保健品處方", icon: Pill },
  { key: "tasks", label: "任務", icon: ClipboardList },
  { key: "lineTrackings", label: "LINE 追蹤", icon: MessageCircle },
];

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger", medium: "warning", low: "info",
};

export default function ClientTabs({ client }: { client: Client }) {
  const [activeTab, setActiveTab] = useState("consultations");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = (client[tab.key as keyof Client] as unknown[]).length;
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
              {count > 0 && <span className="ml-1 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "consultations" && <ConsultationsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "doctorNotes" && <DoctorNotesTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "labTests" && <LabTestsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "prescriptions" && <PrescriptionsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "tasks" && <TasksTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "lineTrackings" && <LineTrackingsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function deleteRecord(url: string, onRefresh: () => void) {
  if (!confirm("確定要刪除這筆記錄嗎？")) return;
  await fetch(url, { method: "DELETE" });
  onRefresh();
}

async function createTask(clientId: string, payload: { title: string; description?: string; dueDate?: string; category?: string; priority?: string }) {
  await fetch(`/api/clients/${clientId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority: "medium", ...payload }),
  });
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="編輯">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="刪除">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-16 text-center text-slate-400 text-sm">{label}</div>;
}

// 任務確認 toast
function TaskConfirmBanner({ tasks, onConfirm, onDismiss }: { tasks: { title: string; dueDate?: string }[]; onConfirm: () => void; onDismiss: () => void; }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <ClipboardList className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800 mb-1">偵測到後續事項，要自動建立任務嗎？</p>
        <ul className="text-xs text-blue-700 mb-3 space-y-0.5">
          {tasks.map((t, i) => (
            <li key={i}>・{t.title}{t.dueDate && <span className="text-blue-500 ml-1">({formatDate(t.dueDate)})</span>}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm}>建立任務</Button>
          <Button size="sm" variant="secondary" onClick={onDismiss}>略過</Button>
        </div>
      </div>
    </div>
  );
}

// ─── 諮詢記錄 ─────────────────────────────────────────────────────────────────

type InlineTask = { id: string; title: string; dueDate: string; priority: string };

function emptyTask(): InlineTask {
  return { id: crypto.randomUUID(), title: "", dueDate: "", priority: "medium" };
}

function InlineTaskList({ tasks, onChange }: { tasks: InlineTask[]; onChange: (tasks: InlineTask[]) => void }) {
  const update = (id: string, field: keyof InlineTask, value: string) =>
    onChange(tasks.map((t) => t.id === id ? { ...t, [field]: value } : t));
  const remove = (id: string) => onChange(tasks.filter((t) => t.id !== id));
  const add = () => onChange([...tasks, emptyTask()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-600">後續任務（存檔時一起建立）</p>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Plus className="w-3 h-3" />新增任務
        </button>
      </div>
      {tasks.length === 0 ? (
        <button type="button" onClick={add}
          className="w-full py-2 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
          + 新增後續任務
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <input
                value={task.title}
                onChange={(e) => update(task.id, "title", e.target.value)}
                placeholder="任務內容..."
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) => update(task.id, "dueDate", e.target.value)}
                className="bg-white text-xs text-slate-600 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <select
                value={task.priority}
                onChange={(e) => update(task.id, "priority", e.target.value)}
                className="bg-white text-xs text-slate-600 border border-slate-200 rounded px-1.5 py-1 focus:outline-none"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <button type="button" onClick={() => remove(task.id)} className="text-slate-300 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsultationsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), chiefComplaint: "", content: "", doctorAdvice: "", nextSteps: "" });
  const [inlineTasks, setInlineTasks] = useState<InlineTask[]>([]);
  const [editForm, setEditForm] = useState({ date: "", chiefComplaint: "", content: "", doctorAdvice: "", nextSteps: "" });
  const [editInlineTasks, setEditInlineTasks] = useState<InlineTask[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}/consultations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    for (const t of inlineTasks.filter((t) => t.title.trim())) {
      await createTask(client.id, { title: t.title.trim(), dueDate: t.dueDate || undefined, priority: t.priority, category: "follow_up" });
    }
    setLoading(false); setShowForm(false); setInlineTasks([]); onRefresh();
  };

  const startEdit = (c: Consultation) => {
    setEditForm({ date: c.date.slice(0, 10), chiefComplaint: c.chiefComplaint || "", content: c.content || "", doctorAdvice: c.doctorAdvice || "", nextSteps: c.nextSteps || "" });
    setEditInlineTasks([]);
    setEditingId(c.id);
    setExpandedIds((prev) => new Set([...prev, c.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/consultations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    for (const t of editInlineTasks.filter((t) => t.title.trim())) {
      await createTask(client.id, { title: t.title.trim(), dueDate: t.dueDate || undefined, priority: t.priority, category: "follow_up" });
    }
    setLoading(false); setEditingId(null); setEditInlineTasks([]); onRefresh();
  };

  const resetForm = () => { setShowForm(false); setInlineTasks([]); };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => showForm ? resetForm() : setShowForm(true)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增諮詢記錄"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增諮詢記錄</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="諮詢日期" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Input label="主訴 / 症狀" placeholder="客戶主要訴求（摘要顯示）" value={form.chiefComplaint} onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
              <Textarea label="諮詢內容" placeholder="詳細討論內容..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
              <Textarea label="醫師建議" placeholder="醫師的建議與處置..." value={form.doctorAdvice} onChange={(e) => setForm((f) => ({ ...f, doctorAdvice: e.target.value }))} rows={2} />
              <Textarea label="備註" placeholder="其他備注..." value={form.nextSteps} onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} rows={2} />
              <div className="border-t border-slate-100 pt-4">
                <InlineTaskList tasks={inlineTasks} onChange={setInlineTasks} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  {inlineTasks.filter(t => t.title.trim()).length > 0 && `將建立 ${inlineTasks.filter(t => t.title.trim()).length} 個任務`}
                </p>
                <Button type="submit" disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {client.consultations.length === 0 && !showForm && <EmptyState label="尚無諮詢記錄" />}

      {client.consultations.map((c) => {
        const expanded = expandedIds.has(c.id);
        const isEditing = editingId === c.id;
        return (
          <Card key={c.id} className={cn(isEditing && "border-blue-300")}>
            <div
              className={cn("flex items-center justify-between px-5 py-3 cursor-pointer select-none", !isEditing && "hover:bg-slate-50")}
              onClick={() => !isEditing && toggleExpand(c.id)}>
              <div className="flex items-center gap-3 min-w-0">
                {!isEditing && (expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />)}
                <span className="text-sm font-semibold text-slate-700">{formatDate(c.date)}</span>
                {c.chiefComplaint && !expanded && !isEditing && <span className="text-sm text-slate-500 truncate">{c.chiefComplaint}</span>}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <CardActions onEdit={() => startEdit(c)} onDelete={() => deleteRecord(`/api/clients/${client.id}/consultations/${c.id}`, onRefresh)} />
                </div>
              )}
            </div>
            {(expanded || isEditing) && (
              <CardContent className="pt-0 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex flex-col gap-4 pt-4">
                    <Input label="諮詢日期" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                    <Input label="主訴 / 症狀" value={editForm.chiefComplaint} onChange={(e) => setEditForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
                    <Textarea label="諮詢內容" value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
                    <Textarea label="醫師建議" value={editForm.doctorAdvice} onChange={(e) => setEditForm((f) => ({ ...f, doctorAdvice: e.target.value }))} rows={2} />
                    <Textarea label="備註" value={editForm.nextSteps} onChange={(e) => setEditForm((f) => ({ ...f, nextSteps: e.target.value }))} rows={2} />
                    <div className="border-t border-slate-100 pt-3">
                      <InlineTaskList tasks={editInlineTasks} onChange={setEditInlineTasks} />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="secondary" onClick={() => { setEditingId(null); setEditInlineTasks([]); }}>取消</Button>
                      <Button onClick={() => saveEdit(c.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm pt-3">
                    {c.chiefComplaint && <Field label="主訴" value={c.chiefComplaint} />}
                    {c.content && <Field label="諮詢內容" value={c.content} />}
                    {c.doctorAdvice && <Field label="醫師建議" value={c.doctorAdvice} />}
                    {c.nextSteps && <Field label="備註" value={c.nextSteps} />}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── 醫師處置 ─────────────────────────────────────────────────────────────────

function DoctorNotesTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), diagnosis: "", treatment: "", notes: "", nextVisit: "" });
  const [editForm, setEditForm] = useState({ date: "", diagnosis: "", treatment: "", notes: "", nextVisit: "" });
  const [loading, setLoading] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}/doctor-notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

    // 若有下次回診日期，自動建立回診任務
    if (form.nextVisit) {
      await createTask(client.id, {
        title: `回診提醒 — ${client.name}`,
        dueDate: form.nextVisit,
        category: "consultation",
        priority: "high",
        description: form.diagnosis ? `診斷：${form.diagnosis}` : undefined,
      });
    }
    setLoading(false); setShowForm(false); onRefresh();
  };

  const startEdit = (n: DoctorNote) => {
    setEditForm({ date: n.date.slice(0, 10), diagnosis: n.diagnosis || "", treatment: n.treatment || "", notes: n.notes || "", nextVisit: n.nextVisit ? n.nextVisit.slice(0, 10) : "" });
    setEditingId(n.id);
    setExpandedIds((prev) => new Set([...prev, n.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/doctor-notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });

    if (editForm.nextVisit) {
      await createTask(client.id, {
        title: `回診提醒 — ${client.name}`,
        dueDate: editForm.nextVisit,
        category: "consultation",
        priority: "high",
        description: editForm.diagnosis ? `診斷：${editForm.diagnosis}` : undefined,
      });
    }
    setLoading(false); setEditingId(null); onRefresh();
  };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增醫師處置"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增醫師處置</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="處置日期" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea label="診斷" placeholder="診斷結果..." value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={2} />
              <Textarea label="治療方式" placeholder="治療方式與處置..." value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={3} />
              <Textarea label="備註" placeholder="其他備注..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              <div>
                <Input label="下次回診日期" type="date" value={form.nextVisit} onChange={(e) => setForm((f) => ({ ...f, nextVisit: e.target.value }))} />
                {form.nextVisit && (
                  <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />存檔時自動建立任務：回診提醒 — {client.name}（{form.nextVisit}）
                  </p>
                )}
              </div>
              <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.doctorNotes.length === 0 && !showForm && <EmptyState label="尚無醫師處置記錄" />}
      {client.doctorNotes.map((n) => {
        const expanded = expandedIds.has(n.id);
        const isEditing = editingId === n.id;
        return (
          <Card key={n.id} className={cn(isEditing && "border-blue-300")}>
            <div
              className={cn("flex items-center justify-between px-5 py-3 cursor-pointer select-none", !isEditing && "hover:bg-slate-50")}
              onClick={() => !isEditing && toggleExpand(n.id)}>
              <div className="flex items-center gap-3 min-w-0">
                {!isEditing && (expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />)}
                <span className="text-sm font-semibold text-slate-700">{formatDate(n.date)}</span>
                {n.diagnosis && !expanded && !isEditing && <span className="text-sm text-slate-500 truncate">{n.diagnosis}</span>}
                {n.nextVisit && !expanded && !isEditing && <Badge variant="info" className="flex-shrink-0">回診 {formatDate(n.nextVisit)}</Badge>}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <CardActions onEdit={() => startEdit(n)} onDelete={() => deleteRecord(`/api/clients/${client.id}/doctor-notes/${n.id}`, onRefresh)} />
                </div>
              )}
            </div>
            {(expanded || isEditing) && (
              <CardContent className="pt-0 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex flex-col gap-4 pt-4">
                    <Input label="處置日期" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                    <Textarea label="診斷" value={editForm.diagnosis} onChange={(e) => setEditForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={2} />
                    <Textarea label="治療方式" value={editForm.treatment} onChange={(e) => setEditForm((f) => ({ ...f, treatment: e.target.value }))} rows={3} />
                    <Textarea label="備註" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                    <div>
                      <Input label="下次回診日期" type="date" value={editForm.nextVisit} onChange={(e) => setEditForm((f) => ({ ...f, nextVisit: e.target.value }))} />
                      {editForm.nextVisit && (
                        <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />存檔時自動建立任務：回診提醒 — {client.name}（{editForm.nextVisit}）
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(n.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm pt-3">
                    {n.diagnosis && <Field label="診斷" value={n.diagnosis} />}
                    {n.treatment && <Field label="治療方式" value={n.treatment} />}
                    {n.notes && <Field label="備註" value={n.notes} />}
                    {n.nextVisit && (
                      <div className="mt-1 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-700">下次回診</span>
                        <span className="text-sm font-semibold text-blue-800">{formatDate(n.nextVisit)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── 檢測 ─────────────────────────────────────────────────────────────────────

function LabTestsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [catalog, setCatalog] = useState<TestItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; custom?: boolean }[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [form, setForm] = useState({ testDate: new Date().toISOString().slice(0, 10), status: "scheduled", findings: "", doctorInterpretation: "", staffExplanation: "" });
  const [loading, setLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({ testDate: "", testType: "", status: "", findings: "", doctorInterpretation: "", staffExplanation: "" });

  useEffect(() => {
    if (showForm) fetch("/api/test-items").then((r) => r.json()).then((d) => setCatalog(Array.isArray(d) ? d : []));
  }, [showForm]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleItem = (item: TestItem) => {
    setSelectedItems((prev) => prev.find((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, { id: item.id, name: item.name }]);
  };

  const addCustom = () => {
    if (!customItem.trim()) return;
    setSelectedItems((prev) => [...prev, { id: crypto.randomUUID(), name: customItem.trim(), custom: true }]);
    setCustomItem("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) { alert("請至少選擇一個檢測項目"); return; }
    setLoading(true);
    for (const item of selectedItems) {
      await fetch(`/api/clients/${client.id}/lab-tests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, testType: item.name }) });
    }
    setLoading(false); setShowForm(false); setSelectedItems([]); onRefresh();
  };

  const startEdit = (t: LabTest) => {
    setEditForm({ testDate: t.testDate ? t.testDate.slice(0, 10) : "", testType: t.testType, status: t.status, findings: t.findings || "", doctorInterpretation: t.doctorInterpretation || "", staffExplanation: t.staffExplanation || "" });
    setEditingId(t.id);
    setExpandedIds((prev) => new Set([...prev, t.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/lab-tests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setLoading(false); setEditingId(null); onRefresh();
  };

  const filteredCatalog = catalog.filter((t) =>
    t.name.toLowerCase().includes(catSearch.toLowerCase()) || (t.category || "").toLowerCase().includes(catSearch.toLowerCase())
  );
  const grouped = filteredCatalog.reduce((acc, t) => {
    const cat = t.category || "其他"; if (!acc[cat]) acc[cat] = []; acc[cat].push(t); return acc;
  }, {} as Record<string, TestItem[]>);

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增檢測單"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增檢測單</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="檢測日期" type="date" value={form.testDate} onChange={(e) => setForm((f) => ({ ...f, testDate: e.target.value }))} />
                <Select label="狀態" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  options={[{ value: "scheduled", label: "已安排" }, { value: "completed", label: "已完成" }, { value: "interpreted", label: "已判讀" }]} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">選擇檢測項目</p>
                {selectedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
                    {selectedItems.map((item) => (
                      <span key={item.id} className="flex items-center gap-1 bg-white text-sm text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                        {item.name}
                        <button type="button" onClick={() => setSelectedItems((p) => p.filter((i) => i.id !== item.id))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setShowCatalog(!showCatalog)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 mb-2">
                  <span className="text-slate-600">從目錄選擇檢測項目</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showCatalog && "rotate-180")} />
                </button>
                {showCatalog && (
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto mb-2">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                      <input value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder="搜尋項目..."
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    {Object.entries(grouped).sort().map(([cat, items]) => (
                      <div key={cat}>
                        <p className="px-3 py-1 text-xs font-semibold text-slate-400 bg-slate-50">{cat}</p>
                        {items.map((item) => (
                          <label key={item.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={!!selectedItems.find((i) => i.id === item.id)} onChange={() => toggleItem(item)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                            <div><p className="text-sm text-slate-800">{item.name}</p>{item.code && <p className="text-xs text-slate-400">{item.code}</p>}</div>
                          </label>
                        ))}
                      </div>
                    ))}
                    {filteredCatalog.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">無符合項目</p>}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={customItem} onChange={(e) => setCustomItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                    placeholder="手動輸入項目名稱..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Button type="button" variant="secondary" size="sm" onClick={addCustom}><Plus className="w-4 h-4" />新增</Button>
                </div>
              </div>
              <Textarea label="檢測結果" placeholder="結果摘要..." value={form.findings} onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))} rows={2} />
              <Textarea label="醫師判讀" placeholder="醫師判讀內容..." value={form.doctorInterpretation} onChange={(e) => setForm((f) => ({ ...f, doctorInterpretation: e.target.value }))} rows={2} />
              <Textarea label="健管師解說" placeholder="健管師解說內容..." value={form.staffExplanation} onChange={(e) => setForm((f) => ({ ...f, staffExplanation: e.target.value }))} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || selectedItems.length === 0}>{loading ? "儲存中..." : `儲存 ${selectedItems.length > 0 ? `(${selectedItems.length} 項)` : ""}`}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.labTests.length === 0 && !showForm && <EmptyState label="尚無檢測記錄" />}
      {client.labTests.map((t) => {
        const expanded = expandedIds.has(t.id);
        const isEditing = editingId === t.id;
        return (
          <Card key={t.id} className={cn(isEditing && "border-blue-300")}>
            <div
              className={cn("flex items-center justify-between px-5 py-3 cursor-pointer select-none", !isEditing && "hover:bg-slate-50")}
              onClick={() => !isEditing && toggleExpand(t.id)}>
              <div className="flex items-center gap-3 min-w-0">
                {!isEditing && (expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />)}
                <span className="text-sm font-semibold text-slate-700">{t.testType}</span>
                {t.testDate && <span className="text-xs text-slate-400">{formatDate(t.testDate)}</span>}
                <Badge variant={t.status === "completed" ? "success" : t.status === "scheduled" ? "info" : "default"} className="flex-shrink-0">
                  {STATUS_LABELS[t.status] || t.status}
                </Badge>
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <CardActions onEdit={() => startEdit(t)} onDelete={() => deleteRecord(`/api/clients/${client.id}/lab-tests/${t.id}`, onRefresh)} />
                </div>
              )}
            </div>
            {(expanded || isEditing) && (
              <CardContent className="pt-0 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="檢測日期" type="date" value={editForm.testDate} onChange={(e) => setEditForm((f) => ({ ...f, testDate: e.target.value }))} />
                      <Select label="狀態" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                        options={[{ value: "scheduled", label: "已安排" }, { value: "completed", label: "已完成" }, { value: "interpreted", label: "已判讀" }]} />
                    </div>
                    <Input label="檢測項目" value={editForm.testType} onChange={(e) => setEditForm((f) => ({ ...f, testType: e.target.value }))} />
                    <Textarea label="檢測結果" value={editForm.findings} onChange={(e) => setEditForm((f) => ({ ...f, findings: e.target.value }))} rows={2} />
                    <Textarea label="醫師判讀" value={editForm.doctorInterpretation} onChange={(e) => setEditForm((f) => ({ ...f, doctorInterpretation: e.target.value }))} rows={2} />
                    <Textarea label="健管師解說" value={editForm.staffExplanation} onChange={(e) => setEditForm((f) => ({ ...f, staffExplanation: e.target.value }))} rows={2} />
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(t.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm pt-3">
                    {t.findings && <Field label="檢測結果" value={t.findings} />}
                    {t.doctorInterpretation && <Field label="醫師判讀" value={t.doctorInterpretation} />}
                    {t.staffExplanation && <Field label="健管師解說" value={t.staffExplanation} />}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── 保健品處方 ───────────────────────────────────────────────────────────────

function PrescriptionsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; dosage: string; custom?: boolean }[]>([]);
  const [customItem, setCustomItem] = useState({ name: "", dosage: "" });
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), totalDays: "", runOutDate: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editItems, setEditItems] = useState<{ id: string; name: string; dosage: string }[]>([]);
  const [editForm, setEditForm] = useState({ date: "", totalDays: "", runOutDate: "", status: "", notes: "" });

  useEffect(() => {
    if (showForm) fetch("/api/products").then((r) => r.json()).then((d) => setCatalog(Array.isArray(d) ? d : []));
  }, [showForm]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleProduct = (p: Product) => {
    setSelectedItems((prev) => prev.find((i) => i.id === p.id) ? prev.filter((i) => i.id !== p.id) : [...prev, { id: p.id, name: p.name, dosage: p.dosage || "" }]);
  };
  const updateDosage = (id: string, dosage: string) => setSelectedItems((prev) => prev.map((i) => i.id === id ? { ...i, dosage } : i));
  const addCustom = () => {
    if (!customItem.name.trim()) return;
    setSelectedItems((prev) => [...prev, { id: crypto.randomUUID(), name: customItem.name.trim(), dosage: customItem.dosage, custom: true }]);
    setCustomItem({ name: "", dosage: "" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) { alert("請至少選擇一個保健品"); return; }
    setLoading(true);
    await fetch(`/api/clients/${client.id}/prescriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, items: selectedItems.map((i) => ({ name: i.name, dosage: i.dosage })) }) });
    setLoading(false); setShowForm(false); setSelectedItems([]); onRefresh();
  };

  const startEdit = (p: Prescription) => {
    let items: { name: string; dosage: string }[] = [];
    try { items = typeof p.items === "string" ? JSON.parse(p.items) : (p.items as { name: string; dosage?: string }[]) || []; } catch { items = []; }
    setEditItems(items.map((i) => ({ id: crypto.randomUUID(), name: i.name, dosage: i.dosage || "" })));
    setEditForm({ date: p.date.slice(0, 10), totalDays: p.totalDays?.toString() || "", runOutDate: p.runOutDate ? p.runOutDate.slice(0, 10) : "", status: p.status, notes: p.notes || "" });
    setEditingId(p.id);
    setExpandedIds((prev) => new Set([...prev, p.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/prescriptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, items: editItems.map((i) => ({ name: i.name, dosage: i.dosage })) }) });
    setLoading(false); setEditingId(null); onRefresh();
  };

  const filteredCatalog = catalog.filter((p) =>
    p.name.toLowerCase().includes(catSearch.toLowerCase()) || (p.category || "").toLowerCase().includes(catSearch.toLowerCase()) || (p.brand || "").toLowerCase().includes(catSearch.toLowerCase())
  );
  const grouped = filteredCatalog.reduce((acc, p) => {
    const cat = p.category || "其他"; if (!acc[cat]) acc[cat] = []; acc[cat].push(p); return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增處方"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增保健品處方</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="開立日期" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">選擇保健品</p>
                {selectedItems.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg flex flex-col gap-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-medium text-slate-700">{item.name}</span>
                        <input value={item.dosage} onChange={(e) => updateDosage(item.id, e.target.value)} placeholder="用法（如：每日2顆，飯後）"
                          className="w-48 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button type="button" onClick={() => setSelectedItems((p) => p.filter((i) => i.id !== item.id))}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setShowCatalog(!showCatalog)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 mb-2">
                  <span className="text-slate-600">從保健品目錄選擇</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showCatalog && "rotate-180")} />
                </button>
                {showCatalog && (
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto mb-2">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                      <input value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder="搜尋保健品..."
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none" />
                    </div>
                    {Object.entries(grouped).sort().map(([cat, products]) => (
                      <div key={cat}>
                        <p className="px-3 py-1 text-xs font-semibold text-slate-400 bg-slate-50">{cat}</p>
                        {products.map((p) => (
                          <label key={p.id} className="flex items-start gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={!!selectedItems.find((i) => i.id === p.id)} onChange={() => toggleProduct(p)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600" />
                            <div><p className="text-sm text-slate-800">{p.name}</p><p className="text-xs text-slate-400">{[p.brand, p.spec, p.dosage].filter(Boolean).join(" · ")}</p></div>
                          </label>
                        ))}
                      </div>
                    ))}
                    {filteredCatalog.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">無符合項目</p>}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={customItem.name} onChange={(e) => setCustomItem((f) => ({ ...f, name: e.target.value }))} placeholder="自訂保健品名稱..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={customItem.dosage} onChange={(e) => setCustomItem((f) => ({ ...f, dosage: e.target.value }))} placeholder="用法..."
                    className="w-36 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Button type="button" variant="secondary" size="sm" onClick={addCustom}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="總天數" type="number" placeholder="30" value={form.totalDays} onChange={(e) => setForm((f) => ({ ...f, totalDays: e.target.value }))} />
                <Input label="預計用完日" type="date" value={form.runOutDate} onChange={(e) => setForm((f) => ({ ...f, runOutDate: e.target.value }))} />
              </div>
              <Textarea label="備註" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || selectedItems.length === 0}>{loading ? "儲存中..." : `儲存 ${selectedItems.length > 0 ? `(${selectedItems.length} 項)` : ""}`}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.prescriptions.length === 0 && !showForm && <EmptyState label="尚無保健品處方" />}
      {client.prescriptions.map((p) => {
        let items: { name: string; dosage?: string }[] = [];
        try { items = typeof p.items === "string" ? JSON.parse(p.items) : (p.items as { name: string }[]) || []; } catch { items = []; }
        const isExpiringSoon = p.runOutDate && new Date(p.runOutDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const expanded = expandedIds.has(p.id);
        const isEditing = editingId === p.id;
        const summary = items.map(i => i.name).join("、");
        return (
          <Card key={p.id} className={cn(isEditing && "border-blue-300")}>
            <div
              className={cn("flex items-center justify-between px-5 py-3 cursor-pointer select-none", !isEditing && "hover:bg-slate-50")}
              onClick={() => !isEditing && toggleExpand(p.id)}>
              <div className="flex items-center gap-3 min-w-0">
                {!isEditing && (expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />)}
                <span className="text-sm font-semibold text-slate-700">{formatDate(p.date)}</span>
                {!expanded && !isEditing && <span className="text-sm text-slate-500 truncate">{summary}</span>}
                <Badge variant={p.status === "active" ? "success" : "default"} className="flex-shrink-0">{STATUS_LABELS[p.status] || p.status}</Badge>
                {p.runOutDate && !expanded && <Badge variant={isExpiringSoon ? "warning" : "outline"} className="flex-shrink-0">用完 {formatDate(p.runOutDate)}</Badge>}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <CardActions onEdit={() => startEdit(p)} onDelete={() => deleteRecord(`/api/clients/${client.id}/prescriptions/${p.id}`, onRefresh)} />
                </div>
              )}
            </div>
            {(expanded || isEditing) && (
              <CardContent className="pt-0 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="開立日期" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                      <Select label="狀態" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                        options={[{ value: "active", label: "使用中" }, { value: "completed", label: "已完成" }, { value: "cancelled", label: "已取消" }]} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">保健品項目</p>
                      <div className="flex flex-col gap-2 mb-2">
                        {editItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input value={item.name} onChange={(e) => setEditItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: e.target.value } : i))}
                              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <input value={item.dosage} onChange={(e) => setEditItems((prev) => prev.map((i) => i.id === item.id ? { ...i, dosage: e.target.value } : i))}
                              placeholder="用法" className="w-44 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <button type="button" onClick={() => setEditItems((prev) => prev.filter((i) => i.id !== item.id))}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setEditItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", dosage: "" }])}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />新增項目</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="總天數" type="number" value={editForm.totalDays} onChange={(e) => setEditForm((f) => ({ ...f, totalDays: e.target.value }))} />
                      <Input label="預計用完日" type="date" value={editForm.runOutDate} onChange={(e) => setEditForm((f) => ({ ...f, runOutDate: e.target.value }))} />
                    </div>
                    <Textarea label="備註" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(p.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3">
                    <table className="w-full text-sm mb-2">
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            <td className="py-1.5 font-medium text-slate-700">{item.name}</td>
                            <td className="py-1.5 text-slate-500 text-right">{item.dosage || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.totalDays && <p className="text-xs text-slate-400">共 {p.totalDays} 天</p>}
                    {p.notes && <p className="text-xs text-slate-500 mt-2">{p.notes}</p>}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── 任務 ─────────────────────────────────────────────────────────────────────

function TasksTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", priority: "medium", category: "" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", dueDate: "", priority: "", category: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); onRefresh();
  };

  const updateStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    onRefresh();
  };

  const startEdit = (task: Task) => {
    setEditForm({ title: task.title, description: task.description || "", dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "", priority: task.priority, category: task.category || "" });
    setEditingId(task.id);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setLoading(false); setEditingId(null); onRefresh();
  };

  const pending = client.tasks.filter((t) => t.status !== "done");
  const done = client.tasks.filter((t) => t.status === "done");

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增任務"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增任務</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="任務標題 *" placeholder="任務名稱..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <Textarea label="說明" placeholder="任務說明..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
              <div className="grid grid-cols-3 gap-4">
                <Input label="截止日期" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
                <Select label="優先級" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  options={[{ value: "high", label: "高" }, { value: "medium", label: "中" }, { value: "low", label: "低" }]} />
                <Select label="類別" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  options={[{ value: "follow_up", label: "追蹤" }, { value: "lab_test", label: "檢測" }, { value: "prescription_refill", label: "補充" }, { value: "consultation", label: "諮詢" }]}
                  placeholder="請選擇" />
              </div>
              <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.tasks.length === 0 && !showForm && <EmptyState label="尚無任務（可從諮詢記錄或醫師處置自動產生）" />}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-slate-500">待處理 ({pending.length})</h3>
          {pending.map((task) => (
            <TaskCard key={task.id} task={task} editing={editingId === task.id} editForm={editForm} setEditForm={setEditForm}
              onStatusChange={updateStatus} onEdit={() => startEdit(task)} onDelete={() => deleteRecord(`/api/tasks/${task.id}`, onRefresh)}
              onSave={() => saveEdit(task.id)} onCancelEdit={() => setEditingId(null)} saving={loading} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-slate-400">已完成 ({done.length})</h3>
          {done.map((task) => (
            <TaskCard key={task.id} task={task} editing={editingId === task.id} editForm={editForm} setEditForm={setEditForm}
              onStatusChange={updateStatus} onEdit={() => startEdit(task)} onDelete={() => deleteRecord(`/api/tasks/${task.id}`, onRefresh)}
              onSave={() => saveEdit(task.id)} onCancelEdit={() => setEditingId(null)} saving={loading} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, editing, editForm, setEditForm, onStatusChange, onEdit, onDelete, onSave, onCancelEdit, saving }: {
  task: Task; editing: boolean;
  editForm: { title: string; description: string; dueDate: string; priority: string; category: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; dueDate: string; priority: string; category: string }>>;
  onStatusChange: (id: string, status: string) => void;
  onEdit: () => void; onDelete: () => void; onSave: () => void; onCancelEdit: () => void; saving: boolean;
}) {
  if (editing) {
    return (
      <div className="bg-white border border-blue-200 rounded-lg px-4 py-3 flex flex-col gap-3">
        <Input label="標題" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
        <Textarea label="說明" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="截止日期" type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <Select label="優先級" value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
            options={[{ value: "high", label: "高" }, { value: "medium", label: "中" }, { value: "low", label: "低" }]} />
          <Select label="類別" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
            options={[{ value: "follow_up", label: "追蹤" }, { value: "lab_test", label: "檢測" }, { value: "prescription_refill", label: "補充" }, { value: "consultation", label: "諮詢" }]}
            placeholder="請選擇" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancelEdit}>取消</Button>
          <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "儲存中..." : "儲存"}</Button>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("bg-white border rounded-lg px-4 py-3 flex items-start gap-3", task.status === "done" ? "border-slate-100 opacity-60" : "border-slate-200")}>
      <input type="checkbox" checked={task.status === "done"} onChange={() => onStatusChange(task.id, task.status === "done" ? "pending" : "done")}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-slate-400")}>{task.title}</p>
          <Badge variant={priorityVariant[task.priority] || "default"}>{PRIORITY_LABELS[task.priority]}</Badge>
          {task.category && <Badge variant="outline">{CATEGORY_LABELS[task.category] || task.category}</Badge>}
        </div>
        {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
        {task.dueDate && <p className="text-xs text-slate-400 mt-0.5">截止：{formatDate(task.dueDate)}</p>}
      </div>
      <CardActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// ─── LINE 追蹤 ────────────────────────────────────────────────────────────────

function LineTrackingsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), content: "", response: "", followUpNeeded: false });
  const [editForm, setEditForm] = useState({ date: "", content: "", response: "", followUpNeeded: false });
  const [loading, setLoading] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/line-trackings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); onRefresh();
  };

  const startEdit = (t: LineTracking) => {
    setEditForm({ date: t.date.slice(0, 10), content: t.content, response: t.response || "", followUpNeeded: t.followUpNeeded });
    setEditingId(t.id);
    setExpandedIds((prev) => new Set([...prev, t.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/line-trackings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setLoading(false); setEditingId(null); onRefresh();
  };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增 LINE 追蹤"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增 LINE 追蹤記錄</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="日期" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea label="對話內容 *" placeholder="記錄與客戶的 LINE 對話重點..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} required />
              <Textarea label="客戶回應" placeholder="客戶的回覆或狀況..." value={form.response} onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))} rows={2} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.followUpNeeded} onChange={(e) => setForm((f) => ({ ...f, followUpNeeded: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                需要後續追蹤
              </label>
              <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.lineTrackings.length === 0 && !showForm && <EmptyState label="尚無 LINE 對話記錄" />}
      {client.lineTrackings.map((t) => {
        const expanded = expandedIds.has(t.id);
        const isEditing = editingId === t.id;
        const preview = t.content.length > 50 ? t.content.slice(0, 50) + "…" : t.content;
        return (
          <Card key={t.id} className={cn(isEditing && "border-blue-300")}>
            <div
              className={cn("flex items-center justify-between px-5 py-3 cursor-pointer select-none", !isEditing && "hover:bg-slate-50")}
              onClick={() => !isEditing && toggleExpand(t.id)}>
              <div className="flex items-center gap-3 min-w-0">
                {!isEditing && (expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />)}
                <span className="text-sm font-semibold text-slate-700">{formatDate(t.date)}</span>
                {!expanded && !isEditing && <span className="text-sm text-slate-500 truncate">{preview}</span>}
                {t.followUpNeeded && <Badge variant="warning" className="flex-shrink-0">需追蹤</Badge>}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <CardActions onEdit={() => startEdit(t)} onDelete={() => deleteRecord(`/api/clients/${client.id}/line-trackings/${t.id}`, onRefresh)} />
                </div>
              )}
            </div>
            {(expanded || isEditing) && (
              <CardContent className="pt-0 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex flex-col gap-4 pt-4">
                    <Input label="日期" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                    <Textarea label="對話內容 *" value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
                    <Textarea label="客戶回應" value={editForm.response} onChange={(e) => setEditForm((f) => ({ ...f, response: e.target.value }))} rows={2} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editForm.followUpNeeded} onChange={(e) => setEditForm((f) => ({ ...f, followUpNeeded: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                      需要後續追蹤
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(t.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-sm pt-3">
                    <Field label="對話內容" value={t.content} />
                    {t.response && <Field label="客戶回應" value={t.response} />}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
