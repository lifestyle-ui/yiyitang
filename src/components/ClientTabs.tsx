"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, FlaskConical, Pill, ClipboardList,
  MessageCircle, Stethoscope, Plus, X, ChevronDown, ChevronRight,
  Pencil, Trash2, Calendar, LayoutDashboard, Check, FileText, Activity,
} from "lucide-react";
import { cn, formatDate, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type Client = {
  id: string; name: string; riskLevel: string | null;
  gender: string | null; birthDate: string | null;
  referralSource: string | null;
  consultations: Consultation[]; labTests: LabTest[];
  prescriptions: Prescription[]; tasks: Task[];
  lineTrackings: LineTracking[]; doctorNotes: DoctorNote[];
  healthPlans: unknown[];
};
type Consultation = { id: string; date: string; visitType: string | null; chiefComplaint: string | null; content: string | null; doctorAdvice: string | null; nextSteps: string | null; };
type LabTest = { id: string; testDate: string | null; testType: string; status: string; findings: string | null; doctorInterpretation: string | null; staffExplanation: string | null; };
type Prescription = { id: string; date: string; items: unknown; totalDays: number | null; runOutDate: string | null; status: string; notes: string | null; };
type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: string; status: string; category: string | null; assignedTo: string | null; };
type LineTracking = { id: string; date: string; content: string; response: string | null; followUpNeeded: boolean; scores: Record<string, number> | null; };
type DoctorNote = { id: string; date: string; diagnosis: string | null; treatment: string | null; notes: string | null; nextVisit: string | null; };
type Product = { id: string; name: string; category: string | null; brand: string | null; spec: string | null; dosage: string | null; unit: string; };
type TestItem = { id: string; name: string; category: string | null; code: string | null; turnaround: string | null; };

const TABS = [
  { key: "overview", label: "總覽", icon: LayoutDashboard },
  { key: "consultations", label: "諮詢記錄", icon: MessageSquare },
  { key: "doctorNotes", label: "醫師處置", icon: Stethoscope },
  { key: "labTests", label: "檢測", icon: FlaskConical },
  { key: "prescriptions", label: "保健品處方", icon: Pill },
  { key: "lineTrackings", label: "LINE 追蹤", icon: MessageCircle },
];

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger", medium: "warning", low: "info",
};

export default function ClientTabs({ client }: { client: Client }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-6 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid #ECEAE6" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const noCount = tab.key === "timeline" || tab.key === "overview";
          const count = noCount ? 0 : (client[tab.key as keyof Client] as unknown[])?.length ?? 0;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
              className="flex items-center gap-1.5 px-4 py-3 text-[12.5px] border-b-2 transition-colors whitespace-nowrap tracking-[.01em]"
              style={active
                ? { borderBottomColor: "#1A1A1A", color: "#1A1A1A", fontWeight: 500 }
                : { borderBottomColor: "transparent", color: "#A8A5A0", fontWeight: 400 }}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
              {count > 0 && <span className="ml-1 text-[10.5px] rounded-sm px-1.5 py-0.5" style={{ background: "#F2F0EC", color: "#6A6560", border: "1px solid #DDDAD4" }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "consultations" && <ConsultationsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "doctorNotes" && <DoctorNotesTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "labTests" && <LabTestsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "prescriptions" && <PrescriptionsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "lineTrackings" && <LineTrackingsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "overview" && <OverviewTab client={client} onRefresh={() => router.refresh()} />}
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
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), visitType: "", chiefComplaint: "", content: "", doctorAdvice: "", nextSteps: "" });
  const [taskLines, setTaskLines] = useState("");
  const [editForm, setEditForm] = useState({ date: "", visitType: "", chiefComplaint: "", content: "", doctorAdvice: "", nextSteps: "" });
  const [loading, setLoading] = useState(false);
  const [visitTypeOptions, setVisitTypeOptions] = useState<{ id: string; label: string }[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/options?category=visitType").then(r => r.json()).then(d => setVisitTypeOptions(Array.isArray(d) ? d : []));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}/consultations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const lines = taskLines.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const title of lines) {
      await createTask(client.id, { title, category: "follow_up", priority: "medium" });
    }
    const suggestions = extractSuggestedTasks([form.content, form.doctorAdvice, form.nextSteps]);
    const manualSet = new Set(lines.map((l) => l.toLowerCase()));
    const fresh = suggestions.filter((s) => !manualSet.has(s.toLowerCase()));
    setLoading(false); setShowForm(false); setTaskLines("");
    if (fresh.length > 0) {
      setSuggestedTasks(fresh);
      setSelectedSuggestions(new Set(fresh.map((_, i) => i)));
    }
    onRefresh();
  };

  const startEdit = (c: Consultation) => {
    setEditForm({ date: c.date.slice(0, 10), visitType: c.visitType || "", chiefComplaint: c.chiefComplaint || "", content: c.content || "", doctorAdvice: c.doctorAdvice || "", nextSteps: c.nextSteps || "" });
    setEditingId(c.id);
    setExpandedIds((prev) => new Set([...prev, c.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/consultations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setLoading(false); setEditingId(null);
    onRefresh();
  };

  const resetForm = () => { setShowForm(false); setTaskLines(""); };

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
              <div className="grid grid-cols-2 gap-4">
                <Input label="諮詢日期" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">諮詢類型</label>
                  <select value={form.visitType} onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">請選擇</option>
                    {visitTypeOptions.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <Input label="主訴 / 症狀" placeholder="客戶主要訴求（摘要顯示）" value={form.chiefComplaint} onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
              <Textarea label="諮詢內容" placeholder="詳細討論內容..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
              <Textarea label="醫師建議" placeholder="醫師的建議與處置..." value={form.doctorAdvice} onChange={(e) => setForm((f) => ({ ...f, doctorAdvice: e.target.value }))} rows={2} />
              <Textarea label="備註" placeholder="其他備注..." value={form.nextSteps} onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} rows={2} />
              <div>
                <Textarea label="後續待辦任務" placeholder={"每行一個任務，存檔時自動新增到任務清單\n例如：安排下次回診\n例如：追蹤血壓數值"} value={taskLines} onChange={(e) => setTaskLines(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {suggestedTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">從諮詢內容偵測到後續事項</p>
              <p className="text-xs text-amber-600 mt-0.5">勾選要自動建立的任務</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {suggestedTasks.map((task, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedSuggestions.has(i)}
                  onChange={() => setSelectedSuggestions((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                  className="rounded border-amber-300 accent-amber-600" />
                <span className="text-sm text-amber-900">{task}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => {
              const toCreate = suggestedTasks.filter((_, i) => selectedSuggestions.has(i));
              for (const title of toCreate) await createTask(client.id, { title, category: "follow_up", priority: "medium" });
              setSuggestedTasks([]); onRefresh();
            }}>建立選取的任務</Button>
            <Button size="sm" variant="secondary" onClick={() => setSuggestedTasks([])}>略過</Button>
          </div>
        </div>
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
                {c.visitType && <Badge variant="outline" className="text-xs">{c.visitType}</Badge>}
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
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="諮詢日期" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">諮詢類型</label>
                        <select value={editForm.visitType} onChange={(e) => setEditForm((f) => ({ ...f, visitType: e.target.value }))}
                          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">請選擇</option>
                          {visitTypeOptions.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input label="主訴 / 症狀" value={editForm.chiefComplaint} onChange={(e) => setEditForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
                    <Textarea label="諮詢內容" value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
                    <Textarea label="醫師建議" value={editForm.doctorAdvice} onChange={(e) => setEditForm((f) => ({ ...f, doctorAdvice: e.target.value }))} rows={2} />
                    <Textarea label="備註" value={editForm.nextSteps} onChange={(e) => setEditForm((f) => ({ ...f, nextSteps: e.target.value }))} rows={2} />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(c.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm pt-3">
                    {c.visitType && <Field label="諮詢類型" value={c.visitType} />}
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

// ─── 追蹤評分 ────────────────────────────────────────────────────────────────

const SCORE_CATEGORIES = [
  { key: "sleep", label: "睡眠" },
  { key: "energy", label: "精力" },
  { key: "digestion", label: "消化" },
  { key: "mood", label: "情緒" },
  { key: "pain", label: "疼痛/不適" },
] as const;

type TrackScores = Record<string, number>;

function ScorePicker({ scores, onChange }: { scores: TrackScores; onChange: (s: TrackScores) => void }) {
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "#8A8580" }}>改善程度（1 成＝很差，5 成＝極佳；可不填）</p>
      <div className="flex flex-col gap-2">
        {SCORE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-3">
            <span className="text-xs w-16 flex-shrink-0" style={{ color: "#6A6560" }}>{cat.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button"
                  onClick={() => {
                    const next = { ...scores };
                    if (next[cat.key] === n) delete next[cat.key]; else next[cat.key] = n;
                    onChange(next);
                  }}
                  className="w-7 h-7 text-xs rounded transition-all"
                  style={scores[cat.key] === n
                    ? { background: "#2C4A3E", color: "#fff", border: "1px solid #2C4A3E" }
                    : { background: "#F7F6F3", color: "#8A8580", border: "1px solid #ECEAE6" }}>
                  {n}
                </button>
              ))}
            </div>
            {scores[cat.key] !== undefined && (
              <span className="text-xs" style={{ color: "#2C4A3E" }}>{scores[cat.key]} 成</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBadges({ scores }: { scores: Record<string, number> | null }) {
  if (!scores) return null;
  const filled = SCORE_CATEGORIES.filter((c) => scores[c.key] !== undefined);
  if (filled.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {filled.map((c) => {
        const val = scores[c.key];
        return (
          <span key={c.key} className="text-[10.5px] px-1.5 py-0.5 rounded-sm"
            style={val >= 4
              ? { background: "#EFF4F1", color: "#2C4A3E", border: "1px solid #C4D4CC" }
              : val >= 3
                ? { background: "#FEF9EC", color: "#8A6A00", border: "1px solid #E8D8A0" }
                : { background: "#FEF0F0", color: "#8A3A3A", border: "1px solid #E8B0B0" }}>
            {c.label} {val} 成
          </span>
        );
      })}
    </div>
  );
}

// ─── 進診前交班備忘 ────────────────────────────────────────────────────────────

function HandoverBriefCard({ client }: { client: Client }) {
  const latestConsultation = [...client.consultations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const latestTracking = [...client.lineTrackings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState({
    referralSource: client.referralSource ?? "",
    chiefComplaint: latestConsultation?.chiefComplaint ?? "",
    currentStatus: latestTracking?.content ? latestTracking.content.slice(0, 80) : "",
    todayGoal: "",
  });
  const [copied, setCopied] = useState(false);

  const formatted = [
    `醫師您好，下一位是${client.name}，`,
    brief.referralSource ? `由${brief.referralSource}轉介，` : "",
    brief.chiefComplaint ? `主要問題是「${brief.chiefComplaint}」，` : "",
    brief.currentStatus ? `目前${brief.currentStatus}，` : "",
    brief.todayGoal ? `今日希望確認${brief.todayGoal}。` : "（今日目標請補充）",
  ].join("");

  const copy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const f = (field: keyof typeof brief, val: string) =>
    setBrief((prev) => ({ ...prev, [field]: val }));

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 text-sm py-2.5 px-4 rounded-sm text-left transition-colors"
        style={{ background: "#F2F0EC", border: "1px solid #ECEAE6", color: "#6A6560" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2C4A3E"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ECEAE6"; }}>
        <ClipboardList className="w-4 h-4 flex-shrink-0" style={{ color: "#2C4A3E" }} />
        <span>進診前交班備忘</span>
        <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#A8A5A0" }} />
      </button>
    );
  }

  return (
    <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#C4D4CC" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#EFF4F1", borderBottom: "1px solid #C4D4CC" }}>
        <ClipboardList className="w-4 h-4" style={{ color: "#2C4A3E" }} />
        <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>進診前交班備忘</span>
        <button onClick={() => setOpen(false)} className="ml-auto" style={{ color: "#A8A5A0" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8A8580" }}>轉介來源</label>
            <input value={brief.referralSource} onChange={(e) => f("referralSource", e.target.value)}
              placeholder="例：陳醫師介紹、自行前來"
              className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
              style={{ borderColor: "#DDDAD4" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8A8580" }}>主訴</label>
            <input value={brief.chiefComplaint} onChange={(e) => f("chiefComplaint", e.target.value)}
              placeholder="例：疲勞、睡眠不好"
              className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
              style={{ borderColor: "#DDDAD4" }} />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "#8A8580" }}>目前狀況（上次回診後）</label>
          <input value={brief.currentStatus} onChange={(e) => f("currentStatus", e.target.value)}
            placeholder="例：睡眠稍微改善，但疲勞仍在"
            className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
            style={{ borderColor: "#DDDAD4" }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "#8A8580" }}>今日目標 <span style={{ color: "#B83232" }}>*</span></label>
          <input value={brief.todayGoal} onChange={(e) => f("todayGoal", e.target.value)}
            placeholder="例：確認睡眠改善狀況、調整保健品"
            className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
            style={{ borderColor: "#DDDAD4" }} />
        </div>
        <div className="rounded-sm p-3" style={{ background: "#F9F8F6", border: "1px solid #ECEAE6" }}>
          <p className="text-[10.5px] mb-1.5 font-medium uppercase tracking-[.06em]" style={{ color: "#A8A5A0" }}>交班話術</p>
          <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{formatted}</p>
        </div>
        <div className="flex justify-end">
          <button onClick={copy}
            className="text-xs px-3 py-1.5 rounded-sm border transition-colors"
            style={copied
              ? { background: "#EFF4F1", color: "#2C4A3E", borderColor: "#C4D4CC" }
              : { background: "#fff", color: "#6A6560", borderColor: "#DDDAD4" }}>
            {copied ? "✓ 已複製" : "複製話術"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LINE 追蹤 ────────────────────────────────────────────────────────────────

function LineTrackingsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ date: string; content: string; response: string; followUpNeeded: boolean; scores: TrackScores }>({ date: new Date().toISOString().slice(0, 10), content: "", response: "", followUpNeeded: false, scores: {} });
  const [editForm, setEditForm] = useState<{ date: string; content: string; response: string; followUpNeeded: boolean; scores: TrackScores }>({ date: "", content: "", response: "", followUpNeeded: false, scores: {} });
  const [loading, setLoading] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/line-trackings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, scores: Object.keys(form.scores).length > 0 ? form.scores : null }) });
    setLoading(false); setShowForm(false); setForm({ date: new Date().toISOString().slice(0, 10), content: "", response: "", followUpNeeded: false, scores: {} }); onRefresh();
  };

  const startEdit = (t: LineTracking) => {
    setEditForm({ date: t.date.slice(0, 10), content: t.content, response: t.response || "", followUpNeeded: t.followUpNeeded, scores: (t.scores as TrackScores) || {} });
    setEditingId(t.id);
    setExpandedIds((prev) => new Set([...prev, t.id]));
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}/line-trackings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, scores: Object.keys(editForm.scores).length > 0 ? editForm.scores : null }) });
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
              <ScorePicker scores={form.scores} onChange={(scores) => setForm((f) => ({ ...f, scores }))} />
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
                {!expanded && !isEditing && t.scores && Object.keys(t.scores).length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {SCORE_CATEGORIES.filter((c) => t.scores![c.key] !== undefined).slice(0, 3).map((c) => (
                      <span key={c.key} className="text-[10px] px-1 py-0.5 rounded-sm"
                        style={{ background: "#EFF4F1", color: "#2C4A3E", border: "1px solid #C4D4CC" }}>
                        {c.label}{t.scores![c.key]}
                      </span>
                    ))}
                  </div>
                )}
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
                    <ScorePicker scores={editForm.scores} onChange={(scores) => setEditForm((f) => ({ ...f, scores }))} />
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
                    <ScoreBadges scores={t.scores} />
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

// ─── 關鍵字擷取任務 ────────────────────────────────────────────────────────────

function extractSuggestedTasks(texts: (string | null | undefined)[]): string[] {
  const keywords = ['需要', '請', '安排', '追蹤', '記得', '通知', '預約', '確認', '提醒', '補充', '檢驗', '複診', '回診', '填寫', '聯絡', '告知'];
  const combined = texts.filter(Boolean).join('\n');
  const sentences = combined.split(/[。！？\n；;]+/).map((s) => s.trim()).filter((s) => s.length > 3);
  const found = sentences.filter((s) => keywords.some((kw) => s.includes(kw)));
  return [...new Set(found)];
}

// ─── 診療週期總覽 ──────────────────────────────────────────────────────────────

const CYCLE_TYPES = ["初診", "回診", "專項檢測", "緊急評估"] as const;
type CycleType = typeof CYCLE_TYPES[number];

const CYCLE_TYPE_COLORS: Record<string, string> = {
  "初診": "text-[#2C4A3E]",
  "回診": "text-[#2C4A3E]",
  "專項檢測": "text-[#3A4A5C]",
  "緊急評估": "text-[#6B2C2C]",
};

const CYCLE_STEPS: Record<string, string[]> = {
  "初診": ["健康問卷收集", "初診諮詢", "功能醫學檢測", "等待報告", "報告解讀", "開立保健品處方", "安排回診"],
  "回診": ["回診諮詢", "狀況追蹤評估", "調整保健品處方", "安排下次回診"],
  "專項檢測": ["諮詢說明", "安排專項檢測", "等待報告", "報告解讀", "處置與建議"],
  "緊急評估": ["即時諮詢", "緊急檢測安排", "快速解讀", "處置方案"],
};

const RISK_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  "高風險": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "⚠ 高風險追蹤" },
  "中風險": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "⚡ 中風險觀察" },
  "低風險": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500", label: "✓ 低風險穩定" },
};

type VisitCycleStep = { id: string; label: string; sortOrder: number; isCompleted: boolean; completedAt: string | null; note: string | null };
type VisitCycle = { id: string; type: string; status: string; startDate: string; endDate: string | null; notes: string | null; steps: VisitCycleStep[] };

function stepIcon(label: string) {
  if (label.includes("問卷")) return <ClipboardList className="w-3.5 h-3.5" />;
  if (label.includes("諮詢")) return <MessageSquare className="w-3.5 h-3.5" />;
  if (label.includes("檢測") || label.includes("檢驗")) return <FlaskConical className="w-3.5 h-3.5" />;
  if (label.includes("報告") || label.includes("解讀")) return <FileText className="w-3.5 h-3.5" />;
  if (label.includes("處方") || label.includes("保健品")) return <Pill className="w-3.5 h-3.5" />;
  if (label.includes("回診") || label.includes("安排")) return <Calendar className="w-3.5 h-3.5" />;
  return <Activity className="w-3.5 h-3.5" />;
}

function stepStatusLabel(label: string, isCompleted: boolean, isCurrent: boolean): { text: string; cls: string } {
  if (!isCompleted && !isCurrent) return { text: "未完成", cls: "text-[#A8A5A0] bg-[#F7F6F3] border border-[#ECEAE6]" };
  if (!isCompleted && isCurrent) return { text: "進行中", cls: "text-[#1A1A1A] bg-[#F7F6F3] border border-[#DDDAD4]" };
  return { text: "完成", cls: "text-[#2C4A3E] bg-[#EFF4F1] border border-[#C4D4CC]" };
}

function OverviewTab({ client, onRefresh }: { client: Client; onRefresh: () => void }) {
  const [cycles, setCycles] = useState<VisitCycle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState("回診");
  const [newNote, setNewNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [previewSteps, setPreviewSteps] = useState<string[]>([]);
  const [editRisk, setEditRisk] = useState(false);
  const [riskLevel, setRiskLevel] = useState(client.riskLevel ?? "");
  const [editingCycle, setEditingCycle] = useState<{ id: string; note: string } | null>(null);
  const [editingStep, setEditingStep] = useState<{ id: string; cycleId: string; note: string; label: string } | null>(null);
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());

  const load = async () => {
    const data = await fetch(`/api/clients/${client.id}/cycles`).then((r) => r.json());
    setCycles(Array.isArray(data) ? data : []);
    setFetching(false);
  };

  useEffect(() => { load(); }, [client.id]);

  useEffect(() => {
    fetch("/api/options?category=cycleType").then((r) => r.json()).then((data) => {
      const labels = Array.isArray(data) && data.length > 0
        ? data.map((d: { label: string }) => d.label)
        : ["初診", "回診", "專項檢測", "緊急評估"];
      setAvailableTypes(labels);
      if (!labels.includes(newType)) setNewType(labels[0]);
    });
  }, []);

  useEffect(() => {
    if (!newType) return;
    fetch(`/api/options?category=${encodeURIComponent(`cycleStep_${newType}`)}`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPreviewSteps(data.map((d: { label: string }) => d.label));
      } else {
        setPreviewSteps(CYCLE_STEPS[newType] || []);
      }
    });
  }, [newType]);

  const createCycle = async () => {
    setCreating(true);
    await fetch(`/api/clients/${client.id}/cycles`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, notes: newNote || null }),
    });
    setCreating(false); setShowNew(false); setNewNote(""); await load();
  };

  const deleteCycle = async (cycleId: string) => {
    if (!confirm("確認刪除此週期及所有步驟？")) return;
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}`, { method: "DELETE" });
    await load();
  };

  const deleteStep = async (cycleId: string, stepId: string) => {
    if (!confirm("確認刪除此步驟？")) return;
    setCycles((prev) => prev.map((c) => c.id === cycleId ? { ...c, steps: c.steps.filter((s) => s.id !== stepId) } : c));
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${stepId}`, { method: "DELETE" });
  };

  const saveStepEdit = async () => {
    if (!editingStep) return;
    const { id, cycleId, note, label } = editingStep;
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => s.id === id ? { ...s, note: note || null, label } : s) }
      : c));
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || null, label }),
    });
    setEditingStep(null);
  };

  const saveCycleNote = async () => {
    if (!editingCycle) return;
    await fetch(`/api/clients/${client.id}/cycles/${editingCycle.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: editingCycle.note || null }),
    });
    await load();
    setEditingCycle(null);
  };

  const toggleExpandCycle = (id: string) => {
    setExpandedCycles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleStep = async (cycleId: string, step: VisitCycleStep) => {
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => s.id === step.id ? { ...s, isCompleted: !s.isCompleted, completedAt: !s.isCompleted ? new Date().toISOString() : null } : s) }
      : c));
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${step.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !step.isCompleted }),
    });
  };

  const completeCycle = async (cycleId: string) => {
    if (!confirm("確認結束此週期？")) return;
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    await load();
  };

  const saveRisk = async () => {
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskLevel: riskLevel || null }),
    });
    setEditRisk(false); onRefresh();
  };

  const activeCycle = cycles.find((c) => c.status === "active");
  const pastCycles = cycles.filter((c) => c.status !== "active").sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const riskConf = riskLevel ? RISK_CONFIG[riskLevel] : null;
  const nextStep = activeCycle?.steps.find((s) => !s.isCompleted);
  const cycleNumber = (id: string) => cycles.length - cycles.findIndex((c) => c.id === id);

  const age = client.birthDate
    ? Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const nextVisit = client.doctorNotes
    .flatMap((n) => n.nextVisit ? [n.nextVisit] : [])
    .filter((d) => d >= today).sort()[0] ?? null;

  const activePrescriptions = client.prescriptions.filter((p) => p.status === "active");

  if (fetching) return <div className="py-12 text-center text-sm" style={{ color: "#A8A5A0" }}>載入中...</div>;

  return (
    <div className="max-w-2xl flex flex-col gap-4">

      {/* 客戶摘要列 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm pb-1" style={{ borderBottom: "1px solid #ECEAE6", color: "#8A8580" }}>
        {client.gender && <span>{client.gender}</span>}
        {age !== null && <span>{age} 歲</span>}
        {nextVisit && <span className="font-medium rounded-sm px-2 py-0.5" style={{ color: "#2C4A3E", background: "#EFF4F1", border: "1px solid #C4D4CC" }}>下次回診 {formatDate(nextVisit)}</span>}
        {activePrescriptions.length > 0 && (
          <span>服用中：{activePrescriptions.map((p) => p.items).join("、")}</span>
        )}
        <div className="ml-auto">
          {editRisk ? (
            <div className="flex items-center gap-2">
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
                className="text-xs border rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#ECEAE6" }}>
                <option value="">未設定</option>
                <option value="高風險">高風險</option>
                <option value="中風險">中風險</option>
                <option value="低風險">低風險</option>
              </select>
              <button onClick={saveRisk} className="text-xs font-semibold" style={{ color: "#2C4A3E" }}>儲存</button>
              <button onClick={() => { setEditRisk(false); setRiskLevel(client.riskLevel ?? ""); }} className="text-xs" style={{ color: "#A8A5A0" }}>取消</button>
            </div>
          ) : riskConf ? (
            <button onClick={() => setEditRisk(true)}
              className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", riskConf.bg, riskConf.border, riskConf.text)}>
              ⚠ {riskLevel}
            </button>
          ) : (
            <button onClick={() => setEditRisk(true)} className="text-xs border border-dashed rounded-full px-2.5 py-1" style={{ color: "#A8A5A0", borderColor: "#DDDAD4" }}>
              設定風險等級
            </button>
          )}
        </div>
      </div>

      {/* 進診前交班備忘 */}
      <HandoverBriefCard client={client} />

      {/* 進行中週期 */}
      {activeCycle && (
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#C4D4CC" }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#EFF4F1", borderBottom: "1px solid #C4D4CC" }}>
            <span className="text-xs font-semibold" style={{ color: "#2C4A3E" }}>週期 #{cycleNumber(activeCycle.id)}</span>
            <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{activeCycle.type}</span>
            <span className="text-[10.5px] px-2 py-0.5 rounded-sm tracking-wide ml-1" style={{ background: "#EFF4F1", color: "#2C4A3E", border: "1px solid #C4D4CC" }}>進行中</span>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setEditingCycle({ id: activeCycle.id, note: activeCycle.notes ?? "" })}
                className="text-xs flex items-center gap-1" style={{ color: "#6A6560" }}>
                <Pencil className="w-3 h-3" />備注
              </button>
              <button onClick={() => completeCycle(activeCycle.id)}
                className="text-xs border rounded-sm px-2 py-0.5" style={{ color: "#6A6560", borderColor: "#DDDAD4" }}>
                結束
              </button>
              <button onClick={() => deleteCycle(activeCycle.id)}
                className="text-xs flex items-center gap-1" style={{ color: "#B83232" }}>
                <Trash2 className="w-3 h-3" />刪除
              </button>
            </div>
          </div>

          {/* 水平步驟器 */}
          <div className="px-4 pt-4 pb-2 overflow-x-auto">
            <div className="flex items-start pb-1">
              {activeCycle.steps.map((step, i) => {
                const currentIdx = activeCycle.steps.findIndex((s) => !s.isCompleted);
                const isCurrent = i === currentIdx;
                const isPast = step.isCompleted;
                return (
                  <div key={step.id} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center" style={{ minWidth: Math.max(56, step.label.length * 7 + 8) }}>
                      <button onClick={() => toggleStep(activeCycle.id, step)}
                        className="w-9 h-9 flex items-center justify-center text-sm font-medium border-2 transition-all"
                        style={isPast
                          ? { background: "#2C4A3E", borderColor: "#2C4A3E", color: "#fff", borderRadius: "50%" }
                          : isCurrent
                            ? { background: "#fff", borderColor: "#2C4A3E", color: "#2C4A3E", borderRadius: "50%", boxShadow: "0 0 0 3px #EFF4F1" }
                            : { background: "#fff", borderColor: "#DDDAD4", color: "#C4C0BB", borderRadius: "50%" }}>
                        {isPast ? <Check className="w-4 h-4" /> : i + 1}
                      </button>
                      <span className="text-[10px] mt-1 text-center leading-tight px-1"
                        style={{ color: isPast ? "#2C4A3E" : isCurrent ? "#1A1A1A" : "#C4C0BB", fontWeight: isCurrent ? 500 : 400 }}>
                        {step.label}
                      </span>
                    </div>
                    {i < activeCycle.steps.length - 1 && (
                      <div className="mt-4 flex-shrink-0 w-6" style={{ height: "1.5px", background: isPast ? "#2C4A3E" : "#DDDAD4" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步驟列表（可編輯）*/}
          <div style={{ borderTop: "1px solid #ECEAE6" }}>
            {activeCycle.steps.map((step) => (
              <div key={step.id}>
                {editingStep?.id === step.id ? (
                  <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#F9F8F6", borderBottom: "1px solid #ECEAE6" }}>
                    <input value={editingStep.label}
                      onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
                      className="text-sm border rounded-sm px-2 py-1 w-full focus:outline-none focus:ring-1"
                      style={{ borderColor: "#DDDAD4" }} placeholder="步驟名稱" />
                    <input value={editingStep.note}
                      onChange={(e) => setEditingStep({ ...editingStep, note: e.target.value })}
                      className="text-sm border rounded-sm px-2 py-1 w-full focus:outline-none focus:ring-1"
                      style={{ borderColor: "#DDDAD4" }} placeholder="備注（選填）" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingStep(null)} className="text-xs px-2 py-1 rounded-sm border" style={{ borderColor: "#DDDAD4", color: "#6A6560" }}>取消</button>
                      <button onClick={saveStepEdit} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#2C4A3E" }}>儲存</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 group" style={{ borderBottom: "1px solid #F2F0EC" }}>
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", step.isCompleted ? "bg-[#2C4A3E]" : "bg-[#DDDAD4]")} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: step.isCompleted ? "#8A8580" : "#1A1A1A", textDecoration: step.isCompleted ? "line-through" : "none" }}>
                        {step.label}
                      </span>
                      {step.note && <p className="text-xs mt-0.5 truncate" style={{ color: "#A8A5A0" }}>{step.note}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingStep({ id: step.id, cycleId: activeCycle.id, note: step.note ?? "", label: step.label })}
                        className="p-1.5 rounded" style={{ color: "#8A8580" }}>
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteStep(activeCycle.id, step.id)} className="p-1.5 rounded" style={{ color: "#B83232" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {step.completedAt && <span className="text-xs flex-shrink-0" style={{ color: "#A8A5A0" }}>{formatDate(step.completedAt)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 週期備注 */}
          {editingCycle?.id === activeCycle.id ? (
            <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid #ECEAE6" }}>
              <textarea value={editingCycle.note}
                onChange={(e) => setEditingCycle({ ...editingCycle, note: e.target.value })}
                className="text-sm border rounded-sm px-3 py-2 w-full focus:outline-none focus:ring-1 resize-none"
                style={{ borderColor: "#DDDAD4" }} rows={3}
                placeholder="週期備注（例如：以排毒方案為主，搭配...）" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingCycle(null)} className="text-xs px-2 py-1 rounded-sm border" style={{ borderColor: "#DDDAD4", color: "#6A6560" }}>取消</button>
                <button onClick={saveCycleNote} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#2C4A3E" }}>儲存</button>
              </div>
            </div>
          ) : activeCycle.notes ? (
            <div className="px-4 py-2.5 flex items-start gap-2" style={{ borderTop: "1px solid #ECEAE6", background: "#F9F8F6" }}>
              <span className="text-xs flex-1" style={{ color: "#6A6560" }}>{activeCycle.notes}</span>
              <button onClick={() => setEditingCycle({ id: activeCycle.id, note: activeCycle.notes ?? "" })} style={{ color: "#A8A5A0" }}>
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* 下一步卡片 */}
      {activeCycle && nextStep && (
        <div className="p-4 flex gap-3 rounded-sm" style={{ background: "#EFF4F1", border: "1px solid #C4D4CC" }}>
          <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#2C4A3E" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>下一步：{nextStep.label}</p>
            {nextStep.note && <p className="text-xs mt-0.5" style={{ color: "#7A8A82" }}>{nextStep.note}</p>}
          </div>
        </div>
      )}

      {/* 開啟新週期 */}
      {!showNew ? (
        <button onClick={() => setShowNew(true)}
          className="flex items-center justify-center gap-2 py-3 text-sm transition-colors rounded-sm"
          style={{ border: "1px dashed #DDDAD4", color: "#A8A5A0" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2C4A3E"; (e.currentTarget as HTMLElement).style.borderColor = "#2C4A3E"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A8A5A0"; (e.currentTarget as HTMLElement).style.borderColor = "#DDDAD4"; }}>
          <Plus className="w-4 h-4" />開啟新診療週期
        </button>
      ) : (
        <div className="border rounded-sm p-4 flex flex-col gap-3" style={{ background: "#F9F8F6", borderColor: "#ECEAE6" }}>
          <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>新增診療週期</p>
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#8A8580" }}>週期類型</p>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((t) => (
                <button key={t} onClick={() => setNewType(t)}
                  className={cn("py-2 px-3 rounded-sm text-sm font-medium border transition-colors", newType !== t && "hover:border-[#2C4A3E]")}
                  style={newType === t ? { background: "#2C4A3E", color: "#fff", borderColor: "#2C4A3E" } : { background: "#fff", color: "#6A6560", borderColor: "#DDDAD4" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {previewSteps.length > 0 && (
            <p className="text-xs leading-relaxed" style={{ color: "#A8A5A0" }}>步驟：{previewSteps.join(" → ")}</p>
          )}
          <div>
            <p className="text-xs mb-1" style={{ color: "#8A8580" }}>備注（選填）</p>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
              className="w-full text-sm border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 resize-none"
              style={{ borderColor: "#DDDAD4" }} rows={2}
              placeholder="例如：以排毒方案為主，搭配..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => { setShowNew(false); setNewNote(""); }}>取消</Button>
            <Button size="sm" onClick={createCycle} disabled={creating}>{creating ? "建立中..." : "開始此週期"}</Button>
          </div>
        </div>
      )}

      {/* 歷史週期 */}
      {pastCycles.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[.08em]" style={{ color: "#A8A5A0" }}>歷史週期（{pastCycles.length}）</p>
          {pastCycles.map((cycle) => {
            const num = cycleNumber(cycle.id);
            const completedCount = cycle.steps.filter((s) => s.isCompleted).length;
            const expanded = expandedCycles.has(cycle.id);
            return (
              <div key={cycle.id} className="border rounded-sm overflow-hidden" style={{ borderColor: "#ECEAE6" }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#F9F8F6" }}>
                  <span className="text-xs" style={{ color: "#8A8580" }}>#{num}</span>
                  <span className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{cycle.type}</span>
                  <span className="text-xs" style={{ color: "#A8A5A0" }}>{formatDate(cycle.startDate).slice(0, 7)}</span>
                  <span className="text-xs rounded-sm px-1.5 py-0.5" style={{ background: "#ECEAE6", color: "#8A8580" }}>
                    {completedCount}/{cycle.steps.length} 完成
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => toggleExpandCycle(cycle.id)}
                      className="text-xs flex items-center gap-1" style={{ color: "#8A8580" }}>
                      {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}步驟
                    </button>
                    <button onClick={() => deleteCycle(cycle.id)} className="flex items-center gap-1 text-xs" style={{ color: "#B83232" }}>
                      <Trash2 className="w-3 h-3" />刪除
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div style={{ borderTop: "1px solid #ECEAE6" }}>
                    {cycle.steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3 px-4 py-2 group" style={{ borderBottom: "1px solid #F2F0EC" }}>
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", step.isCompleted ? "bg-[#2C4A3E]" : "bg-[#DDDAD4]")} />
                        <span className="text-sm flex-1" style={{ color: step.isCompleted ? "#8A8580" : "#3A3A3A", textDecoration: step.isCompleted ? "line-through" : "none" }}>
                          {step.label}
                        </span>
                        {step.note && <span className="text-xs" style={{ color: "#A8A5A0" }}>{step.note}</span>}
                        <button onClick={() => deleteStep(cycle.id, step.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1" style={{ color: "#B83232" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {cycle.notes && (
                      <div className="px-4 py-2.5 text-xs" style={{ background: "#F9F8F6", borderTop: "1px solid #ECEAE6", color: "#6A6560" }}>
                        備注：{cycle.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cycles.length === 0 && !showNew && (
        <EmptyState label="尚無診療週期，點擊上方「開啟新診療週期」開始" />
      )}
    </div>
  );
}
// ─── 時間軸 ────────────────────────────────────────────────────────────────────
// ─── 時間軸 ────────────────────────────────────────────────────────────────────

type TimelineEvent = {
  date: string;
  type: "consultation" | "labTest" | "prescription" | "task" | "nextVisit";
  label: string;
  sub?: string;
  color: string;
};

function TimelineTab({ client }: { client: Client }) {
  const events: TimelineEvent[] = [];

  client.consultations.forEach((c) => {
    events.push({ date: c.date, type: "consultation", label: c.visitType || "諮詢記錄", sub: c.chiefComplaint || undefined, color: "bg-blue-500" });
  });

  client.doctorNotes.forEach((d) => {
    if (d.nextVisit) events.push({ date: d.nextVisit, type: "nextVisit", label: "預計回診", sub: d.diagnosis || undefined, color: "bg-purple-500" });
  });

  client.labTests.forEach((l) => {
    if (l.testDate) events.push({ date: l.testDate, type: "labTest", label: `檢驗：${l.testType}`, sub: l.status, color: "bg-teal-500" });
  });

  client.prescriptions.forEach((p) => {
    events.push({ date: p.date, type: "prescription", label: "開立保健品處方", sub: p.runOutDate ? `預計補貨：${formatDate(p.runOutDate)}` : undefined, color: "bg-green-500" });
    if (p.runOutDate) events.push({ date: p.runOutDate, type: "prescription", label: "保健品補貨日", color: "bg-orange-400" });
  });

  client.tasks.forEach((t) => {
    if (t.dueDate && t.status !== "done") events.push({ date: t.dueDate, type: "task", label: t.title, sub: t.status === "in_progress" ? "進行中" : "待處理", color: "bg-amber-500" });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) return <EmptyState label="尚無時間軸記錄，請先新增諮詢或任務" />;

  const today = new Date().toISOString().slice(0, 10);
  const future = events.filter(e => e.date >= today);
  const past = events.filter(e => e.date < today);

  const renderGroup = (title: string, items: TimelineEvent[]) => items.length === 0 ? null : (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
        <div className="flex flex-col gap-4">
          {items.map((e, i) => (
            <div key={i} className="flex items-start gap-4 pl-8 relative">
              <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${e.color} flex-shrink-0`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                  <span className="text-sm font-medium text-slate-700">{e.label}</span>
                </div>
                {e.sub && <p className="text-xs text-slate-500 mt-0.5">{e.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {renderGroup("即將事項", future)}
      {renderGroup("過去記錄", past)}

    </div>
  );
}
