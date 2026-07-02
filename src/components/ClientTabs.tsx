"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, FlaskConical, Pill, ClipboardList,
  MessageCircle, Stethoscope, Plus, X, ChevronDown, ChevronRight,
  Pencil, Trash2, Calendar, LayoutDashboard, Check, FileText, Activity,
  AlertTriangle, GitBranch, Bell, Download,
} from "lucide-react";
import { cn, formatDate, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HanshiOrderForm from "@/components/HanshiOrderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type StepStatus = "pending" | "in_progress" | "completed" | "skipped";
type Complaint = { id: string; date: string; clientWords: string | null; process: string | null; emotionIssue: string | null; actualIssue: string | null; replyGiven: string | null; promisedActions: string | null; promisedDeadline: string | null; followUpResult: string | null; internalSuggestion: string | null; status: string; };
type HealthTimelineEvent = { id: string; date: string; category: string; title: string; description: string | null; };
type FunctionalMatrix = { id?: string; cardiovascular: string | null; nutritional: string | null; environmental: string | null; endocrine: string | null; gut: string | null; neurological: string | null; methylation: string | null; };
type HealthQuestionnaire = { id: string; date: string; chiefComplaint: string | null; healthGoals: string | null; symptoms: string | null; sleep: number | null; energy: number | null; digestion: number | null; mood: number | null; pain: number | null; sleepNotes: string | null; energyNotes: string | null; digestionNotes: string | null; moodNotes: string | null; painNotes: string | null; diet: string | null; exercise: string | null; stress: string | null; currentMeds: string | null; medicalHistory: string | null; allergies: string | null; expectations: string | null; notes: string | null; };

type Client = {
  id: string; name: string; riskLevel: string | null;
  gender: string | null; birthDate: string | null;
  medicalRecordNumber: string | null;
  referralSource: string | null;
  consultations: Consultation[]; labTests: LabTest[];
  prescriptions: Prescription[]; tasks: Task[];
  lineTrackings: LineTracking[]; doctorNotes: DoctorNote[];
  healthPlans: unknown[]; questionnaires: HealthQuestionnaire[];
  complaints: Complaint[]; timelineEvents: HealthTimelineEvent[];
  functionalMatrix: FunctionalMatrix | null;
};
type Consultation = { id: string; date: string; visitType: string | null; chiefComplaint: string | null; content: string | null; doctorAdvice: string | null; nextSteps: string | null; };
type LabTest = { id: string; testDate: string | null; testType: string; status: string; findings: string | null; doctorInterpretation: string | null; staffExplanation: string | null; reportUrl: string | null; price: number | null; sampleCollectedAt: string | null; reportReceivedAt: string | null; };
type Prescription = { id: string; date: string; items: unknown; totalDays: number | null; runOutDate: string | null; status: string; notes: string | null; confirmedAt: string | null; adherenceStatus: string | null; adherenceNotes: string | null; adherenceCheckedAt: string | null; };
type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: string; status: string; category: string | null; assignedTo: string | null; };
type LineTracking = { id: string; date: string; content: string; response: string | null; followUpNeeded: boolean; scores: Record<string, string | number> | null; };
type DoctorNote = { id: string; date: string; diagnosis: string | null; treatment: string | null; notes: string | null; nextVisit: string | null; };
type Product = { id: string; name: string; category: string | null; brand: string | null; spec: string | null; dosage: string | null; unit: string; };
type TestItem = { id: string; name: string; category: string | null; code: string | null; turnaround: string | null; notes: string | null; };

const TABS = [
  { key: "overview", label: "總覽", icon: LayoutDashboard },
  { key: "consultations", label: "諮詢記錄", icon: MessageSquare },
  { key: "doctorNotes", label: "醫師處置", icon: Stethoscope },
  { key: "labTests", label: "檢測", icon: FlaskConical },
  { key: "lineTrackings", label: "LINE 追蹤", icon: MessageCircle },
];

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger", medium: "warning", low: "info",
};

export default function ClientTabs({ client }: { client: Client }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-6 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid #ece5da" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const noCount = tab.key === "timeline" || tab.key === "overview";
          const count = noCount ? 0 : (client[tab.key as keyof Client] as unknown[])?.length ?? 0;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); setShowPrescriptionForm(false); }}
              className="flex items-center gap-1.5 px-4 py-3 text-[12.5px] border-b-2 transition-colors whitespace-nowrap tracking-[.01em]"
              style={active
                ? { borderBottomColor: "#241f1b", color: "#241f1b", fontWeight: 500 }
                : { borderBottomColor: "transparent", color: "#b3a99d", fontWeight: 400 }}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
              {count > 0 && <span className="ml-1 text-[10.5px] rounded-sm px-1.5 py-0.5" style={{ background: "#ece5da", color: "#6b6056", border: "1px solid #d8cfc3" }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "consultations" && (
          <div className="flex gap-4 min-h-full">
            <div className="w-1/2 min-w-0">
              <ConsultationsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />
            </div>
            <div className="w-1/2 min-w-0 border-l border-slate-200 pl-4">
              <PrescriptionsTab client={client} showForm={showPrescriptionForm} setShowForm={setShowPrescriptionForm} onRefresh={() => router.refresh()} />
            </div>
          </div>
        )}
        {activeTab === "doctorNotes" && <DoctorNotesTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "labTests" && <LabTestsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "prescriptions" && <PrescriptionsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "lineTrackings" && <LineTrackingsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "questionnaires" && <QuestionnaireTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
        {activeTab === "matrix" && <FunctionalMatrixTab client={client} onRefresh={() => router.refresh()} />}
        {activeTab === "complaints" && <ComplaintsTab client={client} showForm={showForm} setShowForm={setShowForm} onRefresh={() => router.refresh()} />}
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
  const [showHanshi, setShowHanshi] = useState(false);
  const [viewingHanshi, setViewingHanshi] = useState<LabTest | null>(null);
  const [catalog, setCatalog] = useState<TestItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; notes?: string; turnaround?: string; custom?: boolean }[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [form, setForm] = useState({ testDate: new Date().toISOString().slice(0, 10), status: "scheduled", findings: "", doctorInterpretation: "", staffExplanation: "" });
  const [loading, setLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({ testDate: "", testType: "", status: "", findings: "", doctorInterpretation: "", staffExplanation: "" });
  const samplingNotes = selectedItems.filter((i) => i.notes).map((i) => ({ name: i.name, notes: i.notes!, turnaround: i.turnaround }));

  useEffect(() => {
    if (showForm) fetch("/api/test-items").then((r) => r.json()).then((d) => setCatalog(Array.isArray(d) ? d : []));
  }, [showForm]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleItem = (item: TestItem) => {
    setSelectedItems((prev) => prev.find((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, { id: item.id, name: item.name, notes: item.notes ?? undefined, turnaround: item.turnaround ?? undefined }]);
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
      {showHanshi && <HanshiOrderForm client={client} onClose={() => setShowHanshi(false)} onRefresh={onRefresh} />}
      {viewingHanshi && (() => {
        let saved: { items: { code: string }[]; info: Record<string, unknown> } | undefined;
        try { saved = JSON.parse(viewingHanshi.findings ?? ""); } catch { saved = undefined; }
        return <HanshiOrderForm client={client} onClose={() => setViewingHanshi(null)} onRefresh={onRefresh} existingId={viewingHanshi.id} initialData={saved} />;
      })()}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowHanshi(true)} variant="secondary">
          瀚仕申請單
        </Button>
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
              {/* 採檢注意事項 */}
              {samplingNotes.length > 0 && (
                <div className="rounded-sm p-3 flex flex-col gap-2" style={{ background: "#f3ece0", border: "1px solid #d8cabb" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#876b57" }}>採檢注意事項</p>
                  {samplingNotes.map((s) => (
                    <div key={s.name}>
                      <p className="text-xs font-medium" style={{ color: "#241f1b" }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6b6056" }}>{s.notes}{s.turnaround && `　回報時間：${s.turnaround}`}</p>
                    </div>
                  ))}
                </div>
              )}
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
        const isHanshi = t.testType === "瀚仕功能醫學檢測申請單";
        if (isHanshi) {
          let itemCount = 0;
          try { itemCount = JSON.parse(t.findings ?? "{}").items?.length ?? 0; } catch { itemCount = 0; }
          return (
            <Card key={t.id}>
              <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50" onClick={() => setViewingHanshi(t)}>
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">瀚仕功能醫學檢測申請單</span>
                  {t.testDate && <span className="text-xs text-slate-400">{formatDate(t.testDate)}</span>}
                  {itemCount > 0 && <span className="text-xs text-slate-400">{itemCount} 項</span>}
                  <Badge variant={t.status === "completed" ? "success" : t.status === "scheduled" ? "info" : "default"} className="flex-shrink-0">
                    {STATUS_LABELS[t.status] || t.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => deleteRecord(`/api/clients/${client.id}/lab-tests/${t.id}`, onRefresh)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="刪除">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        }

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

const ADHERENCE_OPTIONS = [
  { value: "on_time",  label: "按時服用" },
  { value: "partial",  label: "偶爾漏服" },
  { value: "stopped",  label: "已自行停用" },
];

type AdherenceLog = { id: string; date: string; status: string; note: string | null };

function AdherenceSection({ prescription: p, clientId }: { prescription: Prescription; clientId: string }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AdherenceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await fetch(`/api/clients/${clientId}/prescriptions/${p.id}/adherence`).then(r => r.json());
    setLogs(Array.isArray(data) ? data : []);
    setLoadingLogs(false);
  };

  const handleOpen = () => { if (!open) loadLogs(); setOpen(!open); };

  const save = async () => {
    if (!newStatus) return;
    setSaving(true);
    await fetch(`/api/clients/${clientId}/prescriptions/${p.id}/adherence`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, status: newStatus, note: newNote || null }),
    });
    setSaving(false); setNewStatus(""); setNewNote(""); setNewDate(new Date().toISOString().slice(0, 10));
    await loadLogs();
  };

  const deleteLog = async (logId: string) => {
    await fetch(`/api/clients/${clientId}/prescriptions/${p.id}/adherence?logId=${logId}`, { method: "DELETE" });
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const latestLog = logs[0];

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #ece5da" }}>
      <button onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
        style={{ background: open ? "#f3ece0" : "#faf7f1" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "#6b6056" }}>規律性追蹤</span>
          {!open && latestLog && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
              style={{ background: latestLog.status === "on_time" ? "#d8cabb" : latestLog.status === "stopped" ? "#f0d6cf" : "#ecdcbf",
                       color: latestLog.status === "on_time" ? "#5c4638" : latestLog.status === "stopped" ? "#8a4634" : "#93702f" }}>
              {ADHERENCE_OPTIONS.find(o => o.value === latestLog.status)?.label}
            </span>
          )}
          {!open && p.adherenceCheckedAt && !latestLog && (
            <span className="text-[10px]" style={{ color: "#b3a99d" }}>上次：{formatDate(p.adherenceCheckedAt)}</span>
          )}
        </div>
        <span className="text-xs" style={{ color: "#b3a99d" }}>{open ? "收起" : "新增紀錄"}</span>
      </button>
      {open && (
        <div className="px-3 py-3 flex flex-col gap-3" style={{ background: "#f3ece0" }}>
          {/* 新增紀錄 */}
          <div className="flex flex-col gap-2 pb-3" style={{ borderBottom: "1px solid #ece5da" }}>
            <div className="flex gap-2 items-center">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="text-xs border rounded-sm px-2 py-1 focus:outline-none" style={{ borderColor: "#d8cfc3" }} />
            </div>
            <div className="flex gap-2">
              {ADHERENCE_OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => setNewStatus(o.value)}
                  className="flex-1 text-xs py-1.5 rounded-sm border transition-colors"
                  style={newStatus === o.value
                    ? { background: "#5c4638", color: "#fff", borderColor: "#5c4638" }
                    : { background: "#fff", color: "#6b6056", borderColor: "#d8cfc3" }}>
                  {o.label}
                </button>
              ))}
            </div>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
              placeholder="備注（如：客戶說胃不舒服、忘記帶出門...）"
              rows={2} className="w-full text-sm border rounded-sm px-2.5 py-1.5 resize-none focus:outline-none"
              style={{ borderColor: "#d8cfc3" }} />
            <div className="flex justify-end">
              <button onClick={save} disabled={saving || !newStatus}
                className="text-xs px-3 py-1 rounded-sm text-white"
                style={{ background: newStatus ? "#5c4638" : "#d8cfc3" }}>
                {saving ? "儲存中..." : "新增紀錄"}
              </button>
            </div>
          </div>
          {/* 歷史紀錄 */}
          {loadingLogs ? (
            <p className="text-xs text-center" style={{ color: "#b3a99d" }}>載入中...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-center" style={{ color: "#b3a99d" }}>尚無追蹤紀錄</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-sm" style={{ background: "#fff" }}>
                  <span style={{ color: "#b3a99d", flexShrink: 0 }}>{formatDate(log.date)}</span>
                  <span className="px-1.5 py-0.5 rounded-sm flex-shrink-0"
                    style={{ background: log.status === "on_time" ? "#d8cabb" : log.status === "stopped" ? "#f0d6cf" : "#ecdcbf",
                             color: log.status === "on_time" ? "#5c4638" : log.status === "stopped" ? "#8a4634" : "#93702f" }}>
                    {ADHERENCE_OPTIONS.find(o => o.value === log.status)?.label}
                  </span>
                  {log.note && <span className="flex-1" style={{ color: "#6b6056" }}>{log.note}</span>}
                  <button onClick={() => deleteLog(log.id)} className="ml-auto flex-shrink-0" style={{ color: "#c8574a" }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PRESCRIPTION_PRESETS: { label: string; items: { name: string; dosage: string }[] }[] = [
  {
    label: "腸道殺菌處方",
    items: [
      { name: "GI Detox", dosage: "1# QD" },
      { name: "腸溶薑黃素", dosage: "1# QN" },
      { name: "Biocidin", dosage: "2# QN" },
      { name: "Serrapeptase", dosage: "2# QN" },
    ],
  },
  {
    label: "汞牙移除",
    items: [
      { name: "薑黃蛋白粉", dosage: "2# QD" },
      { name: "MSM", dosage: "3# BID" },
      { name: "Vit C 1000mg", dosage: "1# TID" },
      { name: "G.I Detox", dosage: "1# BID" },
      { name: "綠藻錠", dosage: "20# BID" },
    ],
  },
  {
    label: "排毒十天",
    items: [
      { name: "UltraClear® RENEW Day 1", dosage: "不服用" },
      { name: "UltraClear® RENEW Day 2–3", dosage: "1# BID" },
      { name: "UltraClear® RENEW Day 4", dosage: "2# BID" },
      { name: "UltraClear® RENEW Day 5–7", dosage: "2# QID" },
      { name: "UltraClear® RENEW Day 8", dosage: "2# TID" },
      { name: "UltraClear® RENEW Day 9", dosage: "2# BID" },
      { name: "UltraClear® RENEW Day 10", dosage: "若沒服用完可以於這天補充" },
      { name: "MSM", dosage: "3# BID" },
      { name: "綠藻錠", dosage: "15# BID" },
      { name: "水飛薊", dosage: "1# BID" },
    ],
  },
];

const FREQ_OPTIONS = ["QD", "BID", "TID", "QID", "QN"];

function DosageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const match = value.match(/^(\d*\.?\d*)#?\s*(.*)$/);
  const qty = match?.[1] ?? "";
  const freqRaw = match?.[2]?.trim() ?? "";
  const isPreset = FREQ_OPTIONS.includes(freqRaw);
  const [custom, setCustom] = useState(!isPreset ? freqRaw : "");
  const [useCustom, setUseCustom] = useState(!isPreset && freqRaw !== "");
  const emit = (q: string, f: string) => onChange(q && f ? `${q}# ${f}` : q ? `${q}#` : f);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center border rounded-sm overflow-hidden" style={{ borderColor: "#d8cfc3" }}>
        <input type="number" min="0" step="0.5" value={qty}
          onChange={(e) => emit(e.target.value, useCustom ? custom : freqRaw)}
          placeholder="顆數"
          className="w-14 px-2 py-1 text-xs text-center focus:outline-none bg-white"
          style={{ borderRight: "1px solid #d8cfc3" }} />
        <span className="px-1 text-xs" style={{ color: "#b3a99d" }}>#</span>
      </div>
      {useCustom ? (
        <input value={custom}
          onChange={(e) => { setCustom(e.target.value); emit(qty, e.target.value); }}
          placeholder="自訂頻率"
          className="w-24 px-2 py-1 text-xs border rounded-sm focus:outline-none"
          style={{ borderColor: "#5c4638" }}
          autoFocus />
      ) : (
        <select value={freqRaw}
          onChange={(e) => {
            if (e.target.value === "__custom__") { setUseCustom(true); setCustom(""); emit(qty, ""); }
            else emit(qty, e.target.value);
          }}
          className="text-xs px-2 py-1 border rounded-sm focus:outline-none bg-white"
          style={{ borderColor: "#d8cfc3" }}>
          <option value="">頻率</option>
          {FREQ_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          <option value="__custom__">自訂…</option>
        </select>
      )}
      {useCustom && (
        <button type="button" onClick={() => { setUseCustom(false); emit(qty, ""); }}
          className="text-[10px]" style={{ color: "#b3a99d" }}>✕</button>
      )}
    </div>
  );
}

function PrescriptionsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; dosage: string; custom?: boolean }[]>([]);
  const [customItem, setCustomItem] = useState({ name: "", dosage: "" });
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), totalDays: "", runOutDate: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editItems, setEditItems] = useState<{ id: string; name: string; dosage: string }[]>([]);
  const [editForm, setEditForm] = useState({ date: "", totalDays: "", runOutDate: "", status: "", notes: "" });
  const [showImport, setShowImport] = useState(false);
  const [importPreviews, setImportPreviews] = useState<{ date: string; items: string }[] | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", "preview");
    const res = await fetch(`/api/clients/${client.id}/import-prescriptions`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.prescriptions) setImportPreviews(data.prescriptions);
    else alert(data.error || "解析失敗");
  };

  const confirmImport = async () => {
    if (!importInputRef.current?.files?.[0]) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", importInputRef.current.files[0]);
    fd.append("mode", "import");
    const res = await fetch(`/api/clients/${client.id}/import-prescriptions`, { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);
    if (data.imported) {
      setShowImport(false); setImportPreviews(null); onRefresh();
    } else {
      alert(data.error || "匯入失敗");
    }
  };

  useEffect(() => {
    if (showForm) fetch("/api/products").then((r) => r.json()).then((d) => setCatalog(Array.isArray(d) ? d : []));
  }, [showForm]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleProduct = (p: Product) => {
    setSelectedItems((prev) => prev.find((i) => i.id === p.id) ? prev.filter((i) => i.id !== p.id) : [...prev, { id: p.id, name: p.name, dosage: "" }]);
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

  const exportPrescription = async (p: Prescription) => {
    setExportingId(p.id);
    let items: { name: string; dosage?: string }[] = [];
    try { items = typeof p.items === "string" ? JSON.parse(p.items) : (p.items as { name: string }[]) || []; } catch { items = []; }

    // Build a hidden div to render into
    const div = document.createElement("div");
    div.style.cssText = "position:fixed;left:-9999px;top:0;width:600px;background:#fff;padding:40px 32px;font-family:sans-serif;color:#241f1b;";
    div.innerHTML = `
      <div style="margin-bottom:4px;font-size:20px;font-weight:bold;">意一堂健康管理</div>
      <div style="font-size:13px;color:#876b57;margin-bottom:20px;">保健品處方單</div>
      <div style="display:flex;gap:24px;font-size:13px;color:#6b6056;margin-bottom:16px;flex-wrap:wrap;">
        <span>客戶：${client.name}（#${client.medicalRecordNumber || ""}）</span>
        <span>開立日期：${new Date(p.date).toLocaleDateString("zh-TW")}</span>
        ${p.totalDays ? `<span>共 ${p.totalDays} 天</span>` : ""}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="background:#f3ece0;padding:8px 12px;text-align:left;font-size:12px;color:#5c4638;border:1px solid #ece5da;">保健品名稱</th>
          <th style="background:#f3ece0;padding:8px 12px;text-align:right;font-size:12px;color:#5c4638;border:1px solid #ece5da;">建議用法</th>
        </tr></thead>
        <tbody>${items.map(i => `<tr>
          <td style="padding:8px 12px;border:1px solid #ece5da;font-size:14px;">${i.name}</td>
          <td style="padding:8px 12px;border:1px solid #ece5da;font-size:14px;text-align:right;">${i.dosage || ""}</td>
        </tr>`).join("")}</tbody>
      </table>
      ${p.notes ? `<p style="margin-top:16px;font-size:13px;color:#6b6056;">備註：${p.notes}</p>` : ""}
      <div style="margin-top:32px;font-size:11px;color:#b3a99d;border-top:1px solid #ece5da;padding-top:12px;">
        此處方由意一堂健康管理系統產生，僅供參考，請遵醫囑使用。
      </div>`;
    document.body.appendChild(div);

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    document.body.removeChild(div);

    const imgW = 190;
    const imgH = (canvas.height * imgW) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, imgW, imgH);
    pdf.save(`處方_${client.name}_${p.date.slice(0, 10)}.pdf`);
    setExportingId(null);
  };

  const catalogBrands = Array.from(new Set(catalog.map((p) => p.brand).filter(Boolean))) as string[];
  const filteredCatalog = catalog.filter((p) => {
    const matchSearch = !catSearch || p.name.toLowerCase().includes(catSearch.toLowerCase()) || (p.category || "").toLowerCase().includes(catSearch.toLowerCase()) || (p.brand || "").toLowerCase().includes(catSearch.toLowerCase());
    const matchBrand = !brandFilter || p.brand === brandFilter;
    return matchSearch && matchBrand;
  });
  const grouped = filteredCatalog.reduce((acc, p) => {
    const cat = p.category || "其他"; if (!acc[cat]) acc[cat] = []; acc[cat].push(p); return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => { setShowImport(!showImport); setImportPreviews(null); }} variant="secondary">
          {showImport ? "取消匯入" : "↑ 匯入 Excel"}
        </Button>
        <Button onClick={() => {
          if (!showForm) {
            // Pre-populate from last prescription
            const last = client.prescriptions?.[0];
            if (last) {
              let items: { name: string; dosage?: string }[] = [];
              try { items = typeof last.items === "string" ? JSON.parse(last.items) : (last.items as { name: string; dosage?: string }[]) || []; } catch { items = []; }
              setSelectedItems(items.map((i) => ({ id: crypto.randomUUID(), name: i.name, dosage: i.dosage || "", custom: true })));
            }
          } else {
            setSelectedItems([]);
          }
          setShowForm(!showForm);
        }} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增處方"}
        </Button>
      </div>
      {showImport && (
        <Card>
          <CardHeader><CardTitle className="text-base">匯入處方（Excel / .xlsx）</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">支援上傳 <strong>.docx</strong>（Word / Google Docs 下載）或 <strong>.xlsx</strong>（Excel）。系統會自動識別每欄的日期與處方內容。</p>
            <input ref={importInputRef} type="file" accept=".xlsx,.xls,.docx" onChange={handleImportFile}
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
            {importPreviews && importPreviews.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-600">解析結果（共 {importPreviews.length} 筆）：</p>
                {importPreviews.map((p, i) => (
                  <div key={i} className="border border-slate-200 rounded p-3 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-1">日期：{p.date}</p>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{p.items}</pre>
                  </div>
                ))}
                <Button onClick={confirmImport} disabled={importing} variant="primary">
                  {importing ? "匯入中..." : `確認匯入 ${importPreviews.length} 筆`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
                        <DosageInput value={item.dosage} onChange={(v) => updateDosage(item.id, v)} />
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
                  <div className="border rounded-sm max-h-72 overflow-y-auto mb-2" style={{ borderColor: "#d8cfc3" }}>
                    <div className="sticky top-0 p-2 flex flex-col gap-1.5" style={{ background: "#faf7f1", borderBottom: "1px solid #ece5da" }}>
                      <input value={catSearch} onChange={(e) => { setCatSearch(e.target.value); setBrandFilter(null); }} placeholder="搜尋保健品..."
                        className="w-full px-3 py-1.5 text-sm rounded-sm focus:outline-none" style={{ border: "1px solid #d8cfc3" }} />
                      {/* 處方套餐快選 */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESCRIPTION_PRESETS.map((preset) => (
                          <button key={preset.label} type="button"
                            onClick={() => {
                              const toAdd = preset.items.map((item) => ({ id: crypto.randomUUID(), name: item.name, dosage: item.dosage, custom: true }));
                              setSelectedItems((prev) => {
                                const existingNames = new Set(prev.map((i) => i.name));
                                return [...prev, ...toAdd.filter((i) => !existingNames.has(i.name))];
                              });
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-sm border transition-colors"
                            style={{ background: "#f3ece0", color: "#5c4638", borderColor: "#d8cabb", fontWeight: 500 }}>
                            ＋{preset.label}
                          </button>
                        ))}
                      </div>
                      {catalogBrands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {catalogBrands.map((brand) => (
                            <button key={brand} type="button"
                              onClick={() => setBrandFilter((prev) => prev === brand ? null : brand)}
                              className="text-[11px] px-2 py-0.5 rounded-sm border transition-colors"
                              style={brandFilter === brand
                                ? { background: "#5c4638", color: "#fff", borderColor: "#5c4638" }
                                : { background: "#fff", color: "#6b6056", borderColor: "#d8cfc3" }}>
                              {brand}
                            </button>
                          ))}
                        </div>
                      )}
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
                  <button onClick={() => exportPrescription(p)} disabled={exportingId === p.id}
                    className="p-1.5 rounded hover:opacity-70 disabled:opacity-40" style={{ color: "#5c4638" }} title={exportingId === p.id ? "產生中…" : "匯出 PDF"}>
                    {exportingId === p.id ? <span className="text-xs">…</span> : <Download className="w-3.5 h-3.5" />}
                  </button>
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
                        options={[
                          { value: "active", label: "有效" },
                          { value: "packing", label: "正在包裝" },
                          { value: "packing_done", label: "打包完成" },
                          { value: "shipped", label: "已寄送" },
                          { value: "received", label: "確認客人已收到" },
                          { value: "started", label: "已開始服用" },
                          { value: "completed", label: "已完成" },
                          { value: "cancelled", label: "已取消" },
                        ]} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">保健品項目</p>
                      <div className="flex flex-col gap-2 mb-2">
                        {editItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input value={item.name} onChange={(e) => setEditItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: e.target.value } : i))}
                              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <DosageInput value={item.dosage} onChange={(v) => setEditItems((prev) => prev.map((i) => i.id === item.id ? { ...i, dosage: v } : i))} />
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
                  <div className="pt-3 flex flex-col gap-3">
                    <table className="w-full text-sm">
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="border-b last:border-0" style={{ borderColor: "#ece5da" }}>
                            <td className="py-1.5 font-medium" style={{ color: "#241f1b" }}>{item.name}</td>
                            <td className="py-1.5 text-right text-sm" style={{ color: "#6b6056" }}>{item.dosage || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.totalDays && <p className="text-xs" style={{ color: "#b3a99d" }}>共 {p.totalDays} 天</p>}
                    {p.notes && <p className="text-xs mt-1" style={{ color: "#6b6056" }}>{p.notes}</p>}
                    {/* 規律性追蹤 */}
                    <AdherenceSection prescription={p} clientId={client.id} />
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
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingStart, setTrackingStart] = useState("");

  const createTrackingNodes = async () => {
    if (!trackingStart) return;
    const base = new Date(trackingStart);
    const add = (days: number) => { const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
    const nodes = [
      { title: `【追蹤】${client.name} — 開始後 5 天`, dueDate: add(5) },
      { title: `【追蹤】${client.name} — 開始後 2 週`, dueDate: add(14) },
      { title: `【追蹤】${client.name} — 開始後 4 週`, dueDate: add(28) },
      { title: `【複查】${client.name} — 1–3 個月複查`, dueDate: add(90) },
    ];
    for (const node of nodes) await createTask(client.id, { ...node, priority: "medium", category: "follow_up" });
    setShowTrackingModal(false);
    setTrackingStart("");
    onRefresh();
  };

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
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowTrackingModal(!showTrackingModal)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-sm transition-colors"
          style={{ borderColor: showTrackingModal ? "#5c4638" : "#d8cfc3", color: showTrackingModal ? "#5c4638" : "#6b6056" }}>
          <Bell className="w-4 h-4" />追蹤節點
        </button>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增任務"}
        </Button>
      </div>
      {showTrackingModal && (
        <div className="border rounded-sm p-4 flex flex-col gap-3" style={{ background: "#f3ece0", borderColor: "#d8cabb" }}>
          <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>自動建立追蹤節點</p>
          <p className="text-xs" style={{ color: "#6b6056" }}>從指定日期起，自動建立 4 個追蹤任務：5天、2週、4週、1–3個月複查。</p>
          <div>
            <label className="text-xs font-medium" style={{ color: "#8b8076" }}>方案開始日期</label>
            <input type="date" value={trackingStart} onChange={(e) => setTrackingStart(e.target.value)}
              className="mt-1 w-full text-sm border rounded-sm px-2 py-1.5 focus:outline-none" style={{ borderColor: "#d8cfc3" }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTrackingModal(false)} className="text-xs px-2 py-1 border rounded-sm" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
            <button onClick={createTrackingNodes} disabled={!trackingStart}
              className="text-xs px-3 py-1 rounded-sm text-white" style={{ background: trackingStart ? "#5c4638" : "#d8cfc3" }}>
              建立 4 個追蹤任務
            </button>
          </div>
        </div>
      )}
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

type TrackScores = Record<string, string | number>;

const LINE_DIMS = [
  { key: "_eff",    label: "有效性",  placeholder: "方案是否有效？症狀改善情況？" },
  { key: "_safe",   label: "安全性",  placeholder: "有無不適、副作用或過敏反應？" },
  { key: "_reg",    label: "規律性",  placeholder: "是否按時服用？有無漏服或自行停用？" },
  { key: "_life",   label: "生活方案", placeholder: "飲食、運動、睡眠等生活方案執行狀況？" },
  { key: "_urgent", label: "突發症狀", placeholder: "是否有突發或緊急狀況？需立即回應？" },
] as const;

function ScorePicker({ scores, onChange }: { scores: TrackScores; onChange: (s: TrackScores) => void }) {
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "#8b8076" }}>改善程度（1 成＝很差，5 成＝極佳；可不填）</p>
      <div className="flex flex-col gap-2">
        {SCORE_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-3">
            <span className="text-xs w-16 flex-shrink-0" style={{ color: "#6b6056" }}>{cat.label}</span>
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
                    ? { background: "#5c4638", color: "#fff", border: "1px solid #5c4638" }
                    : { background: "#faf7f1", color: "#8b8076", border: "1px solid #ece5da" }}>
                  {n}
                </button>
              ))}
            </div>
            {scores[cat.key] !== undefined && (
              <span className="text-xs" style={{ color: "#5c4638" }}>{scores[cat.key]} 成</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBadges({ scores }: { scores: Record<string, string | number> | null }) {
  if (!scores) return null;
  const filled = SCORE_CATEGORIES.filter((c) => typeof scores[c.key] === "number");
  if (filled.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {filled.map((c) => {
        const val = scores[c.key] as number;
        return (
          <span key={c.key} className="text-[10.5px] px-1.5 py-0.5 rounded-sm"
            style={val >= 4
              ? { background: "#ece2d6", color: "#5c4638", border: "1px solid #d8cabb" }
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
        style={{ background: "#ece5da", border: "1px solid #ece5da", color: "#6b6056" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#5c4638"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ece5da"; }}>
        <ClipboardList className="w-4 h-4 flex-shrink-0" style={{ color: "#5c4638" }} />
        <span>進診前交班備忘</span>
        <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#b3a99d" }} />
      </button>
    );
  }

  return (
    <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#d8cabb" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#ece2d6", borderBottom: "1px solid #d8cabb" }}>
        <ClipboardList className="w-4 h-4" style={{ color: "#5c4638" }} />
        <span className="text-sm font-medium" style={{ color: "#241f1b" }}>進診前交班備忘</span>
        <button onClick={() => setOpen(false)} className="ml-auto" style={{ color: "#b3a99d" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b8076" }}>轉介來源</label>
            <input value={brief.referralSource} onChange={(e) => f("referralSource", e.target.value)}
              placeholder="例：陳醫師介紹、自行前來"
              className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
              style={{ borderColor: "#d8cfc3" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#8b8076" }}>主訴</label>
            <input value={brief.chiefComplaint} onChange={(e) => f("chiefComplaint", e.target.value)}
              placeholder="例：疲勞、睡眠不好"
              className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
              style={{ borderColor: "#d8cfc3" }} />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "#8b8076" }}>目前狀況（上次回診後）</label>
          <input value={brief.currentStatus} onChange={(e) => f("currentStatus", e.target.value)}
            placeholder="例：睡眠稍微改善，但疲勞仍在"
            className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
            style={{ borderColor: "#d8cfc3" }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "#8b8076" }}>今日目標 <span style={{ color: "#b8392c" }}>*</span></label>
          <input value={brief.todayGoal} onChange={(e) => f("todayGoal", e.target.value)}
            placeholder="例：確認睡眠改善狀況、調整保健品"
            className="w-full text-sm border rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1"
            style={{ borderColor: "#d8cfc3" }} />
        </div>
        <div className="rounded-sm p-3" style={{ background: "#f3ece0", border: "1px solid #ece5da" }}>
          <p className="text-[10.5px] mb-1.5 font-medium uppercase tracking-[.06em]" style={{ color: "#b3a99d" }}>交班話術</p>
          <p className="text-sm leading-relaxed" style={{ color: "#241f1b" }}>{formatted}</p>
        </div>
        <div className="flex justify-end">
          <button onClick={copy}
            className="text-xs px-3 py-1.5 rounded-sm border transition-colors"
            style={copied
              ? { background: "#ece2d6", color: "#5c4638", borderColor: "#d8cabb" }
              : { background: "#fff", color: "#6b6056", borderColor: "#d8cfc3" }}>
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
              {/* 5 追蹤維度 */}
              <div className="rounded-sm p-3 flex flex-col gap-3" style={{ background: "#f3ece0", border: "1px solid #d8cabb" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#876b57" }}>追蹤五維度</p>
                {LINE_DIMS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: "#6b6056" }}>{label}</label>
                    <textarea
                      value={(form.scores[key] as string) || ""}
                      onChange={(e) => setForm((f) => ({ ...f, scores: { ...f.scores, [key]: e.target.value } }))}
                      placeholder={placeholder}
                      rows={2}
                      className="w-full text-sm border rounded-sm px-2.5 py-1.5 resize-none focus:outline-none"
                      style={{ borderColor: "#d8cfc3" }} />
                  </div>
                ))}
              </div>
              <Textarea label="其他備注" placeholder="其他對話重點、觀察..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3} />
              <ScorePicker scores={form.scores} onChange={(scores) => setForm((f) => ({ ...f, scores }))} />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.followUpNeeded} onChange={(e) => setForm((f) => ({ ...f, followUpNeeded: e.target.checked }))} className="w-4 h-4" />
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
                        style={{ background: "#ece2d6", color: "#5c4638", border: "1px solid #d8cabb" }}>
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
                    <div className="rounded-sm p-3 flex flex-col gap-3" style={{ background: "#f3ece0", border: "1px solid #d8cabb" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#876b57" }}>追蹤五維度</p>
                      {LINE_DIMS.map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs font-medium block mb-1" style={{ color: "#6b6056" }}>{label}</label>
                          <textarea value={(editForm.scores[key] as string) || ""} onChange={(e) => setEditForm((f) => ({ ...f, scores: { ...f.scores, [key]: e.target.value } }))}
                            placeholder={placeholder} rows={2}
                            className="w-full text-sm border rounded-sm px-2.5 py-1.5 resize-none focus:outline-none" style={{ borderColor: "#d8cfc3" }} />
                        </div>
                      ))}
                    </div>
                    <Textarea label="其他備注" value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} rows={3} />
                    <ScorePicker scores={editForm.scores} onChange={(scores) => setEditForm((f) => ({ ...f, scores }))} />
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editForm.followUpNeeded} onChange={(e) => setEditForm((f) => ({ ...f, followUpNeeded: e.target.checked }))} className="w-4 h-4" />
                      需要後續追蹤
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                      <Button onClick={() => saveEdit(t.id)} disabled={loading}>{loading ? "儲存中..." : "儲存"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm pt-3">
                    {/* 5 追蹤維度 */}
                    {t.scores && LINE_DIMS.some(({ key }) => t.scores![key]) && (
                      <div className="rounded-sm p-3 flex flex-col gap-2" style={{ background: "#f3ece0", border: "1px solid #d8cabb" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: "#876b57" }}>追蹤五維度</p>
                        {LINE_DIMS.filter(({ key }) => t.scores![key]).map(({ key, label }) => (
                          <div key={key}>
                            <p className="text-xs font-medium" style={{ color: "#6b6056" }}>{label}</p>
                            <p className="text-sm mt-0.5" style={{ color: "#241f1b" }}>{t.scores![key] as string}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {t.content && <Field label="其他備注" value={t.content} />}
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

const CYCLE_TYPES = ["初診諮詢", "檢測", "健康計畫", "AMD", "排毒10天", "回診"] as const;
type CycleType = typeof CYCLE_TYPES[number];

const CYCLE_TYPE_COLORS: Record<string, string> = {
  "初診諮詢":   "text-[#5c4638]",
  "檢測":     "text-[#3A4A5C]",
  "健康計畫": "text-[#3d6b4f]",
  "AMD":        "text-[#6B2C2C]",
  "排毒10天":   "text-[#6B2C2C]",
  "回診":       "text-[#5c4638]",
};

// § 前綴代表「階段標題」，不可勾選、不計入進度
const CYCLE_STEPS: Record<string, string[]> = {
  "初診諮詢": [
    "§ 初診階段",
    "問卷收集",
    "安排諮詢時間",
    "諮詢當天：完成諮詢記錄",
    "醫師確認診斷與治療方向",
  ],
  "檢測": [
    "§ 檢測安排",
    "提供檢測報價",
    "預約檢測時間",
    "檢體採集衛教",
    "採集當天：確認狀況、完成採集",
    "§ 等待報告",
    "確認檢體送出",
    "等待報告產出",
    "§ 報告解析",
    "預約報告解析時間",
    "報告解析諮詢",
    "醫師開立後續計畫",
  ],
  "健康計畫": [
    "§ 出貨作業",
    "提供保健品報價",
    "產品打包與寄送",
    "確認客戶收到保健品",
    "§ 追蹤關懷",
    "第1週追蹤關懷",
    "第3週追蹤關懷",
    "§ 後續安排",
    "預約下次回診",
  ],
  "AMD": [],
  "排毒10天": [
    "§ 前置作業",
    "INBODY 測量（開始前）",
    "說明十天飲食原則及禁忌食物",
    "確認保健品備齊（UltraClear Plus pH／MSM／綠藻錠／Liver Protect）",
    "§ Day 1–2｜初始期",
    "飲食：遵循基本飲食及烹調原則",
    "保健品：UltraClear Plus pH 早晚各1匙、MSM 早晚各3顆、綠藻錠 早晚各15顆、Liver Protect 早晚各1顆",
    "追蹤：確認排毒反應（頭暈、疲倦、口氣、情緒等）",
    "§ Day 3–4｜限制期",
    "飲食：主食限馬鈴薯／南瓜／地瓜／山藥／青豆仁；蛋白質限鱸魚／鱈魚／鮭魚／草魚／鯖魚",
    "保健品：UltraClear Plus pH Day3早晚各1匙、Day4晚飯後各2匙，其餘同上",
    "§ Day 5–7｜深度排毒期",
    "飲食：不可吃主食；水果限蘋果／梨，份數增為3份",
    "保健品：UltraClear Plus pH 早晚各4匙，其餘同上",
    "追蹤：確認飲食執行狀況與排毒反應",
    "§ Day 8｜過渡期",
    "飲食：放寬水果種類；主食限白米／馬鈴薯／南瓜／地瓜／山藥／青豆仁",
    "保健品：UltraClear Plus pH 早午晚各2匙，其餘同上",
    "§ Day 9–10｜收尾期",
    "飲食：同 Day 1–2 原則",
    "保健品：UltraClear Plus pH 早晚各2匙（Day10可補足空腹份量），其餘同上",
    "§ 療程結束",
    "INBODY 測量（結束）",
    "追蹤關懷：確認整體感受與身體變化",
    "預約回診",
  ],
  "回診": [
    "§ 回診流程",
    "Gather 收集",
    "Tell 重述",
    "Order 排序",
    "Initiate 啟動",
    "Track 追蹤",
  ],
};

const RISK_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  "高風險": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "⚠ 高風險追蹤" },
  "中風險": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "⚡ 中風險觀察" },
  "低風險": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500", label: "✓ 低風險穩定" },
};

type VisitCycleStep = {
  id: string; label: string; sortOrder: number;
  isCompleted: boolean; completedAt: string | null; note: string | null; status?: StepStatus;
  role?: string | null; deliverable?: string | null; isKeyOutput?: boolean;
  deliverableDone?: boolean; defaultOffset?: string | null; hasDueTracking?: boolean;
  dueDate?: string | null; metadata?: string | null;
};
type VisitCycle = { id: string; type: string; status: string; startDate: string; endDate: string | null; notes: string | null; steps: VisitCycleStep[] };

const STEP_CYCLE: Record<StepStatus, StepStatus> = { pending: "in_progress", in_progress: "completed", completed: "pending", skipped: "pending" };
const STEP_STATUS_STYLE: Record<StepStatus, { bg: string; border: string; color: string; label: string }> = {
  pending:     { bg: "#fff",     border: "#d8cfc3", color: "#b3a99d", label: "未開始" },
  in_progress: { bg: "#fff",     border: "#5c4638", color: "#5c4638", label: "進行中" },
  completed:   { bg: "#5c4638", border: "#5c4638", color: "#fff",    label: "完成"   },
  skipped:     { bg: "#faf7f1", border: "#d8cfc3", color: "#b3a99d", label: "略過"   },
};

function stepIcon(label: string) {
  if (label.includes("Gather"))   return <ClipboardList className="w-3.5 h-3.5" />;
  if (label.includes("Organize")) return <FileText className="w-3.5 h-3.5" />;
  if (label.includes("Tell"))     return <MessageSquare className="w-3.5 h-3.5" />;
  if (label.includes("Order"))    return <Activity className="w-3.5 h-3.5" />;
  if (label.includes("Initiate")) return <Pill className="w-3.5 h-3.5" />;
  if (label.includes("Track"))    return <FlaskConical className="w-3.5 h-3.5" />;
  // fallbacks for custom steps
  if (label.includes("問卷") || label.includes("收集")) return <ClipboardList className="w-3.5 h-3.5" />;
  if (label.includes("諮詢")) return <MessageSquare className="w-3.5 h-3.5" />;
  if (label.includes("檢測")) return <FlaskConical className="w-3.5 h-3.5" />;
  if (label.includes("處方")) return <Pill className="w-3.5 h-3.5" />;
  if (label.includes("回診") || label.includes("安排")) return <Calendar className="w-3.5 h-3.5" />;
  return <Activity className="w-3.5 h-3.5" />;
}

function stepStatusLabel(label: string, isCompleted: boolean, isCurrent: boolean): { text: string; cls: string } {
  if (!isCompleted && !isCurrent) return { text: "未完成", cls: "text-[#b3a99d] bg-[#faf7f1] border border-[#ece5da]" };
  if (!isCompleted && isCurrent) return { text: "進行中", cls: "text-[#241f1b] bg-[#faf7f1] border border-[#d8cfc3]" };
  return { text: "完成", cls: "text-[#5c4638] bg-[#ece2d6] border border-[#d8cabb]" };
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
  const [customTypeName, setCustomTypeName] = useState("");
  const [customStepLines, setCustomStepLines] = useState("");
  const [editingCycle, setEditingCycle] = useState<{ id: string; note: string } | null>(null);
  const [editingStep, setEditingStep] = useState<{ id: string; cycleId: string; note: string; label: string; insertAfterHeaderId?: string } | null>(null);
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
        : [...CYCLE_TYPES];
      setAvailableTypes(labels);
      if (!labels.includes(newType)) setNewType(labels[0]);
    });
  }, []);

  useEffect(() => {
    if (!newType) return;
    // Check CycleTypeStep first, then fall back to OptionConfig, then CYCLE_STEPS
    fetch(`/api/cycle-type-steps?cycleType=${encodeURIComponent(newType)}`).then((r) => r.json()).then((richSteps) => {
      if (Array.isArray(richSteps) && richSteps.length > 0) {
        setPreviewSteps(richSteps.map((d: { label: string }) => d.label));
        return;
      }
      fetch(`/api/options?category=${encodeURIComponent(`cycleStep_${newType}`)}`).then((r) => r.json()).then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPreviewSteps(data.map((d: { label: string }) => d.label));
        } else {
          setPreviewSteps(CYCLE_STEPS[newType] || []);
        }
      });
    });
  }, [newType]);

  const createCycle = async () => {
    const isCustom = newType === "自定義";
    const finalType = isCustom ? (customTypeName.trim() || "自定義") : newType;
    setCreating(true);
    const body: Record<string, unknown> = { type: finalType, notes: newNote || null };
    if (isCustom && customStepLines.trim()) {
      body.customSteps = customStepLines.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    await fetch(`/api/clients/${client.id}/cycles`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCreating(false); setShowNew(false); setNewNote(""); setCustomTypeName(""); setCustomStepLines(""); await load();
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

  const [creatingTaskForStep, setCreatingTaskForStep] = useState<{ stepId: string; title: string; dueDate: string; priority: string } | null>(null);

  const [gatingError, setGatingError] = useState<string | null>(null);

  const cycleStep = async (cycleId: string, step: VisitCycleStep) => {
    const cur: StepStatus = step.status ?? (step.isCompleted ? "completed" : "pending");
    const next = STEP_CYCLE[cur];
    // Optimistic update
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => s.id === step.id ? { ...s, status: next, isCompleted: next === "completed", completedAt: next === "completed" ? new Date().toISOString() : null } : s) }
      : c));
    const res = await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${step.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.status === 422) {
      const json = await res.json();
      // Revert optimistic update
      setCycles((prev) => prev.map((c) => c.id === cycleId
        ? { ...c, steps: c.steps.map((s) => s.id === step.id ? { ...s, status: cur, isCompleted: cur === "completed", completedAt: s.completedAt } : s) }
        : c));
      setGatingError(json.message ?? "請先完成交付物再標記此步驟");
      setTimeout(() => setGatingError(null), 4000);
    }
  };

  const toggleDeliverableDone = async (cycleId: string, step: VisitCycleStep) => {
    const next = !step.deliverableDone;
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => s.id === step.id ? { ...s, deliverableDone: next } : s) }
      : c));
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${step.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliverableDone: next }),
    });
  };

  const cyclePhase = async (cycleId: string, phaseStep: VisitCycleStep, allCycleSteps: VisitCycleStep[]) => {
    const phaseIdx = allCycleSteps.indexOf(phaseStep);
    const nextHeader = allCycleSteps.slice(phaseIdx + 1).find((s) => s.label.startsWith("§ "));
    const nextIdx = nextHeader ? allCycleSteps.indexOf(nextHeader) : allCycleSteps.length;
    const children = allCycleSteps.slice(phaseIdx + 1, nextIdx).filter((s) => !s.label.startsWith("§ "));
    const allDone = children.every((s) => s.isCompleted || s.status === "completed" || s.status === "skipped");
    const nextStatus: StepStatus = allDone ? "pending" : "completed";
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => children.find((ch) => ch.id === s.id)
          ? { ...s, status: nextStatus, isCompleted: nextStatus === "completed", completedAt: nextStatus === "completed" ? new Date().toISOString() : null }
          : s) }
      : c));
    await Promise.all(children.map((s) =>
      fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${s.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
    ));
  };

  const moveStep = async (cycleId: string, stepId: string, direction: "up" | "down") => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const steps = [...cycle.steps]; // already sorted by sortOrder
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    // Swap in local state
    const newSteps = [...steps];
    [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
    setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, steps: newSteps } : c));
    // Persist via bulk reorder
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIds: newSteps.map(s => s.id) }),
    });
  };

  const addStepToSection = async (cycleId: string, headerStepId: string | null, label: string, note: string) => {
    if (!label.trim()) return;
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const steps = cycle.steps;
    let insertAfterIdx: number;
    if (headerStepId === null) {
      insertAfterIdx = steps.length - 1;
    } else {
      const headerIdx = steps.findIndex(s => s.id === headerStepId);
      // Find last step before next header
      let end = steps.length - 1;
      for (let i = headerIdx + 1; i < steps.length; i++) {
        if (steps[i].label.startsWith("§ ")) { end = i - 1; break; }
      }
      insertAfterIdx = end;
    }
    // Insert step (temporarily at end), then reorder
    const res = await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, note: note || null, sortOrder: 9999 }),
    });
    const newStep = await res.json();
    if (!newStep.id) return;
    // Build new ordered list with inserted step
    const newOrder = [...steps];
    newOrder.splice(insertAfterIdx + 1, 0, newStep);
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIds: newOrder.map(s => s.id) }),
    });
    await load();
  };

  const skipStep = async (cycleId: string, step: VisitCycleStep) => {
    const next: StepStatus = step.status === "skipped" ? "pending" : "skipped";
    setCycles((prev) => prev.map((c) => c.id === cycleId
      ? { ...c, steps: c.steps.map((s) => s.id === step.id ? { ...s, status: next, isCompleted: false, completedAt: null } : s) }
      : c));
    await fetch(`/api/clients/${client.id}/cycles/${cycleId}/steps/${step.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const submitStepTask = async () => {
    if (!creatingTaskForStep) return;
    await createTask(client.id, {
      title: creatingTaskForStep.title,
      dueDate: creatingTaskForStep.dueDate || undefined,
      priority: creatingTaskForStep.priority,
      category: "follow_up",
    });
    setCreatingTaskForStep(null);
    onRefresh();
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

  const activeCycles = cycles.filter((c) => c.status === "active");
  const activeCycle = activeCycles[0];
  const pastCycles = cycles.filter((c) => c.status !== "active").sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const riskConf = riskLevel ? RISK_CONFIG[riskLevel] : null;
  const nextStep = activeCycle?.steps.find((s) => !s.isCompleted && !s.label.startsWith("§ "));
  const cycleNextSteps = activeCycles.map((c) => ({
    cycle: c,
    step: c.steps.find((s) => !s.isCompleted && !s.label.startsWith("§ ")),
  })).filter((x) => x.step);
  const cycleNumber = (id: string) => cycles.length - cycles.findIndex((c) => c.id === id);

  const age = client.birthDate
    ? Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const nextVisit = client.doctorNotes
    .flatMap((n) => n.nextVisit ? [n.nextVisit] : [])
    .filter((d) => d >= today).sort()[0] ?? null;

  const activePrescriptions = client.prescriptions.filter((p) => p.status === "active");

  if (fetching) return <div className="py-12 text-center text-sm" style={{ color: "#b3a99d" }}>載入中...</div>;

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {gatingError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white bg-amber-600">
          ⚠ {gatingError}
        </div>
      )}

      {/* 客戶摘要列 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm pb-1" style={{ borderBottom: "1px solid #ece5da", color: "#8b8076" }}>
        {client.gender && <span>{client.gender}</span>}
        {age !== null && <span>{age} 歲</span>}
        {nextVisit && <span className="font-medium rounded-sm px-2 py-0.5" style={{ color: "#5c4638", background: "#ece2d6", border: "1px solid #d8cabb" }}>下次回診 {formatDate(nextVisit)}</span>}
        <div className="ml-auto">
          {editRisk ? (
            <div className="flex items-center gap-2">
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
                className="text-xs border rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#ece5da" }}>
                <option value="">未設定</option>
                <option value="高風險">高風險</option>
                <option value="中風險">中風險</option>
                <option value="低風險">低風險</option>
              </select>
              <button onClick={saveRisk} className="text-xs font-semibold" style={{ color: "#5c4638" }}>儲存</button>
              <button onClick={() => { setEditRisk(false); setRiskLevel(client.riskLevel ?? ""); }} className="text-xs" style={{ color: "#b3a99d" }}>取消</button>
            </div>
          ) : riskConf ? (
            <button onClick={() => setEditRisk(true)}
              className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", riskConf.bg, riskConf.border, riskConf.text)}>
              ⚠ {riskLevel}
            </button>
          ) : (
            <button onClick={() => setEditRisk(true)} className="text-xs border border-dashed rounded-full px-2.5 py-1" style={{ color: "#b3a99d", borderColor: "#d8cfc3" }}>
              設定風險等級
            </button>
          )}
        </div>
      </div>

      {/* 下一步卡片 */}
      {cycleNextSteps.length > 0 && (
        <div className="flex flex-col gap-2">
          {cycleNextSteps.map(({ cycle, step }) => (
            <div key={cycle.id} className="p-4 flex gap-3 rounded-sm" style={{ background: "#ece2d6", border: "1px solid #d8cabb" }}>
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#5c4638" }} />
              <div className="flex-1 min-w-0">
                {activeCycles.length > 1 && (
                  <p className="text-xs mb-0.5" style={{ color: "#876b57" }}>{cycle.type}</p>
                )}
                <p className="text-sm font-medium" style={{ color: "#241f1b" }}>下一步：{step!.label}</p>
                {step!.note && <p className="text-xs mt-0.5" style={{ color: "#876b57" }}>{step!.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 進行中週期（可能多個） */}
      {activeCycles.map((activeCycle) => (
        <div key={activeCycle.id} className="border rounded-sm overflow-hidden" style={{ borderColor: "#d8cabb" }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#ece2d6", borderBottom: "1px solid #d8cabb" }}>
            <span className="text-xs font-semibold" style={{ color: "#5c4638" }}>週期 #{cycleNumber(activeCycle.id)}</span>
            <span className="text-sm font-medium" style={{ color: "#241f1b" }}>{activeCycle.type}</span>
            <span className="text-[10.5px] px-2 py-0.5 rounded-sm tracking-wide ml-1" style={{ background: "#ece2d6", color: "#5c4638", border: "1px solid #d8cabb" }}>進行中</span>
            <span className="text-[10px]" style={{ color: "#b3a99d" }}>
              {(() => { const d = new Date(activeCycle.startDate); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} 開始`; })()}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setEditingCycle({ id: activeCycle.id, note: activeCycle.notes ?? "" })}
                className="text-xs flex items-center gap-1" style={{ color: "#6b6056" }}>
                <Pencil className="w-3 h-3" />備注
              </button>
              <button onClick={() => completeCycle(activeCycle.id)}
                className="text-xs border rounded-sm px-2 py-0.5" style={{ color: "#6b6056", borderColor: "#d8cfc3" }}>
                結束
              </button>
              <button onClick={() => deleteCycle(activeCycle.id)}
                className="text-xs flex items-center gap-1" style={{ color: "#b8392c" }}>
                <Trash2 className="w-3 h-3" />刪除
              </button>
            </div>
          </div>

          {/* 水平步驟器：只顯示階段標題 */}
          <div className="px-4 pt-4 pb-2 overflow-x-auto">
            <div className="flex items-start pb-1">
              {(activeCycle.steps.some((s) => s.label.startsWith("§ "))
                ? activeCycle.steps.filter((s) => s.label.startsWith("§ "))
                : activeCycle.steps
              ).map((step, i, arr) => {
                const headers = activeCycle.steps.filter((s) => s.label.startsWith("§ "));
                const nextHeader = headers[i + 1];
                const myIdx = activeCycle.steps.findIndex((s) => s.id === step.id);
                const nextIdx = nextHeader ? activeCycle.steps.findIndex((s) => s.id === nextHeader.id) : activeCycle.steps.length;
                const mySteps = activeCycle.steps.slice(myIdx + 1, nextIdx).filter((s) => !s.label.startsWith("§ "));
                const allDone = mySteps.length > 0 && mySteps.every((s) => s.isCompleted || s.status === "completed" || s.status === "skipped");
                const anyDone = mySteps.some((s) => s.isCompleted || s.status === "completed" || s.status === "in_progress");
                const st: StepStatus = allDone ? "completed" : anyDone ? "in_progress" : "pending";
                const sty = STEP_STATUS_STYLE[st];
                const displayLabel = step.label.startsWith("§ ") ? step.label.slice(2) : step.label;
                return (
                  <div key={step.id} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center" style={{ minWidth: Math.max(56, displayLabel.length * 7 + 8) }}>
                      <div className="w-9 h-9 flex items-center justify-center text-sm font-medium border-2"
                        style={{ background: sty.bg, borderColor: sty.border, color: sty.color, borderRadius: "50%", ...(st === "in_progress" ? { boxShadow: "0 0 0 3px #ece2d6" } : {}) }}>
                        {st === "completed" ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-[10px] mt-1 text-center leading-tight px-1"
                        style={{ color: sty.color !== "#fff" ? sty.color : "#5c4638", fontWeight: st === "in_progress" ? 500 : 400 }}>
                        {displayLabel}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mt-4 flex-shrink-0 w-6" style={{ height: "1.5px", background: st === "completed" ? "#5c4638" : "#d8cfc3" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步驟列表（可編輯）*/}
          <div style={{ borderTop: "1px solid #ece5da" }}>
            {activeCycle.steps.map((step, stepIdx) => {
              const isHeader = step.label.startsWith("§ ");
              if (isHeader) return (
                <div key={step.id} style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}>
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[.12em] flex-1" style={{ color: "#876b57" }}>
                      {step.label.slice(2)}
                    </span>
                    <button onClick={() => setEditingStep({ id: "__new__", cycleId: activeCycle.id, note: "", label: "", insertAfterHeaderId: step.id })}
                      className="text-[10px] flex items-center gap-0.5 hover:opacity-70" style={{ color: "#5c4638" }}>
                      <Plus className="w-3 h-3" />新增
                    </button>
                    <button onClick={() => setEditingStep({ id: step.id, cycleId: activeCycle.id, note: step.note ?? "", label: step.label })}
                      className="p-1 rounded" style={{ color: "#b3a99d" }}><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteStep(activeCycle.id, step.id)} className="p-1 rounded" style={{ color: "#b8392c" }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                  {editingStep?.id === "__new__" && editingStep.cycleId === activeCycle.id && (editingStep as { insertAfterHeaderId?: string }).insertAfterHeaderId === step.id && (
                    <div className="px-4 py-2 flex flex-col gap-2" style={{ borderTop: "1px solid #ece5da" }}>
                      <input value={editingStep.label} onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
                        className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="步驟名稱" autoFocus />
                      <input value={editingStep.note} onChange={(e) => setEditingStep({ ...editingStep, note: e.target.value })}
                        className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="備注（選填）" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingStep(null)} className="text-xs px-2 py-1 border rounded-sm" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
                        <button onClick={async () => {
                          await addStepToSection(activeCycle.id, step.id, editingStep.label, editingStep.note);
                          setEditingStep(null);
                        }} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>新增</button>
                      </div>
                    </div>
                  )}
                </div>
              );
              const st: StepStatus = step.status ?? (step.isCompleted ? "completed" : "pending");
              return (
                <div key={step.id}>
                  {creatingTaskForStep?.stepId === step.id && (
                    <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}
                      onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs font-semibold" style={{ color: "#5c4638" }}>建立追蹤任務</p>
                      <input value={creatingTaskForStep.title}
                        onChange={(e) => { e.stopPropagation(); setCreatingTaskForStep((prev) => prev ? { ...prev, title: e.target.value } : prev); }}
                        className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="任務標題" />
                      <div className="flex gap-2">
                        <input type="date" value={creatingTaskForStep.dueDate}
                          onChange={(e) => { e.stopPropagation(); setCreatingTaskForStep((prev) => prev ? { ...prev, dueDate: e.target.value } : prev); }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-sm border rounded-sm px-2 py-1" style={{ borderColor: "#d8cfc3" }} />
                        <select value={creatingTaskForStep.priority} onChange={(e) => setCreatingTaskForStep({ ...creatingTaskForStep, priority: e.target.value })}
                          className="text-sm border rounded-sm px-2 py-1" style={{ borderColor: "#d8cfc3" }}>
                          <option value="high">🔴 高</option>
                          <option value="medium">🟡 中</option>
                          <option value="low">🟢 低</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setCreatingTaskForStep(null)} className="text-xs px-2 py-1 border rounded-sm" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
                        <button onClick={submitStepTask} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>建立任務</button>
                      </div>
                    </div>
                  )}
                  {editingStep?.id === step.id ? (
                    <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}>
                      <input value={editingStep.label} onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
                        className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="步驟名稱" />
                      <input value={editingStep.note} onChange={(e) => setEditingStep({ ...editingStep, note: e.target.value })}
                        className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="備注（選填）" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingStep(null)} className="text-xs px-2 py-1 rounded-sm border" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
                        <button onClick={saveStepEdit} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>儲存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 group" style={{ borderBottom: "1px solid #ece5da" }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st === "completed" ? "#5c4638" : st === "in_progress" ? "#5A8A7A" : "#d8cfc3" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {step.isKeyOutput && <span className="text-amber-500 text-xs leading-none" title="關鍵交付物">★</span>}
                          <span className="text-sm" style={{ color: st === "completed" || st === "skipped" ? "#8b8076" : "#241f1b", textDecoration: st === "completed" || st === "skipped" ? "line-through" : "none" }}>
                            {step.label}
                          </span>
                        </div>
                        {step.isKeyOutput && step.deliverable && (
                          <button
                            onClick={() => toggleDeliverableDone(activeCycle.id, step)}
                            className={`mt-0.5 text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors ${step.deliverableDone ? "bg-green-50 border-green-300 text-green-700" : "bg-white border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-700"}`}
                            title="點擊確認交付物完成">
                            {step.deliverableDone ? "✓" : "○"} {step.deliverable}
                          </button>
                        )}
                        {step.note && <p className="text-xs mt-0.5 truncate" style={{ color: "#b3a99d" }}>{step.note}</p>}
                      </div>
                      <button onClick={() => cycleStep(activeCycle.id, step)}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0 transition-opacity hover:opacity-70"
                        style={{ background: st === "completed" ? "#d4ede8" : st === "in_progress" ? "#e8f0ed" : "#ece5da", color: st === "completed" ? "#2d7a6a" : st === "in_progress" ? "#2d7a6a" : "#8b8076" }}>
                        {STEP_STATUS_STYLE[st].label}
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveStep(activeCycle.id, step.id, "up")} disabled={stepIdx === 0}
                          className="p-1 rounded text-[11px] disabled:opacity-20" style={{ color: "#b3a99d" }} title="上移">↑</button>
                        <button onClick={() => moveStep(activeCycle.id, step.id, "down")} disabled={stepIdx === activeCycle.steps.length - 1}
                          className="p-1 rounded text-[11px] disabled:opacity-20" style={{ color: "#b3a99d" }} title="下移">↓</button>
                        <button onClick={() => setEditingStep({ id: step.id, cycleId: activeCycle.id, note: step.note ?? "", label: step.label })}
                          className="p-1.5 rounded" style={{ color: "#b3a99d" }} title="編輯"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => deleteStep(activeCycle.id, step.id)} className="p-1.5 rounded" style={{ color: "#c8574a" }} title="刪除"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      {step.hasDueTracking && step.dueDate && st !== "completed" && st !== "skipped" && (() => {
                        const diffMs = new Date(step.dueDate).getTime() - Date.now();
                        const overdue = diffMs < 0;
                        const abs = Math.abs(diffMs);
                        const totalMins = Math.floor(abs / 60000);
                        const hours = Math.floor(totalMins / 60);
                        const mins = totalMins % 60;
                        const days = Math.floor(hours / 24);
                        const remHours = hours % 24;
                        let label = "";
                        if (days > 0) label = `${days} 天 ${remHours > 0 ? remHours + " 小時" : ""}`.trim();
                        else if (hours > 0) label = `${hours} 小時 ${mins > 0 ? mins + " 分" : ""}`.trim();
                        else label = `${totalMins} 分鐘`;
                        const urgent = !overdue && diffMs < 6 * 3600000;
                        return (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${overdue ? "bg-red-50 text-red-600" : urgent ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                            {overdue ? `逾期 ${label}` : `還有 ${label}`}
                          </span>
                        );
                      })()}
                      {step.completedAt && <span className="text-xs flex-shrink-0" style={{ color: "#b3a99d" }}>{formatDate(step.completedAt)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 新增步驟（無階段標題的療程才顯示底部按鈕） */}
          {!activeCycle.steps.some(s => s.label.startsWith("§ ")) && (
            <>
              <div className="px-4 py-2" style={{ borderTop: "1px solid #ece5da" }}>
                <button onClick={() => setEditingStep({ id: "__new__", cycleId: activeCycle.id, note: "", label: "" })}
                  className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: "#5c4638" }}>
                  <Plus className="w-3 h-3" />新增步驟
                </button>
              </div>
              {editingStep?.id === "__new__" && editingStep.cycleId === activeCycle.id && !editingStep.insertAfterHeaderId && (
                <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#f3ece0", borderTop: "1px solid #ece5da" }}>
                  <input value={editingStep.label} onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
                    className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="步驟名稱" autoFocus />
                  <input value={editingStep.note} onChange={(e) => setEditingStep({ ...editingStep, note: e.target.value })}
                    className="text-sm border rounded-sm px-2 py-1 w-full" style={{ borderColor: "#d8cfc3" }} placeholder="備注（選填）" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingStep(null)} className="text-xs px-2 py-1 rounded-sm border" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
                    <button onClick={async () => {
                      await addStepToSection(activeCycle.id, null, editingStep.label, editingStep.note);
                      setEditingStep(null);
                    }} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>新增</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 週期備注 */}
          {editingCycle?.id === activeCycle.id ? (
            <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid #ece5da" }}>
              <textarea value={editingCycle.note}
                onChange={(e) => setEditingCycle({ ...editingCycle, note: e.target.value })}
                className="text-sm border rounded-sm px-3 py-2 w-full focus:outline-none focus:ring-1 resize-none"
                style={{ borderColor: "#d8cfc3" }} rows={3}
                placeholder="週期備注（例如：以排毒方案為主，搭配...）" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingCycle(null)} className="text-xs px-2 py-1 rounded-sm border" style={{ borderColor: "#d8cfc3", color: "#6b6056" }}>取消</button>
                <button onClick={saveCycleNote} className="text-xs px-2 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>儲存</button>
              </div>
            </div>
          ) : activeCycle.notes ? (
            <div className="px-4 py-2.5 flex items-start gap-2" style={{ borderTop: "1px solid #ece5da", background: "#f3ece0" }}>
              <span className="text-xs flex-1" style={{ color: "#6b6056" }}>{activeCycle.notes}</span>
              <button onClick={() => setEditingCycle({ id: activeCycle.id, note: activeCycle.notes ?? "" })} style={{ color: "#b3a99d" }}>
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>
      ))}


      {/* 開啟新週期 */}
      {!showNew ? (
        <button onClick={() => setShowNew(true)}
          className="flex items-center justify-center gap-2 py-3 text-sm transition-colors rounded-sm"
          style={{ border: "1px dashed #d8cfc3", color: "#b3a99d" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#5c4638"; (e.currentTarget as HTMLElement).style.borderColor = "#5c4638"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#b3a99d"; (e.currentTarget as HTMLElement).style.borderColor = "#d8cfc3"; }}>
          <Plus className="w-4 h-4" />開啟新診療週期
        </button>
      ) : (
        <div className="border rounded-sm p-4 flex flex-col gap-3" style={{ background: "#f3ece0", borderColor: "#ece5da" }}>
          <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>新增診療週期</p>
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#8b8076" }}>週期類型</p>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((t) => (
                <button key={t} onClick={() => setNewType(t)}
                  className={cn("py-2 px-3 rounded-sm text-sm font-medium border transition-colors", newType !== t && "hover:border-[#5c4638]")}
                  style={newType === t ? { background: "#5c4638", color: "#fff", borderColor: "#5c4638" } : { background: "#fff", color: "#6b6056", borderColor: "#d8cfc3" }}>
                  {t}
                </button>
              ))}
              <button onClick={() => setNewType("自定義")}
                className={cn("py-2 px-3 rounded-sm text-sm font-medium border transition-colors", newType !== "自定義" && "hover:border-[#5c4638]")}
                style={newType === "自定義" ? { background: "#5c4638", color: "#fff", borderColor: "#5c4638" } : { background: "#fff", color: "#6b6056", borderColor: "#d8cfc3", borderStyle: "dashed" }}>
                ＋ 自定義
              </button>
            </div>
          </div>
          {newType === "自定義" ? (
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs mb-1" style={{ color: "#8b8076" }}>療程名稱</p>
                <input value={customTypeName} onChange={(e) => setCustomTypeName(e.target.value)}
                  className="w-full text-sm border rounded-sm px-3 py-1.5 focus:outline-none" style={{ borderColor: "#d8cfc3" }}
                  placeholder="例如：過敏調理、荷爾蒙平衡..." />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "#8b8076" }}>步驟（每行一步，選填）</p>
                <textarea value={customStepLines} onChange={(e) => setCustomStepLines(e.target.value)}
                  className="w-full text-sm border rounded-sm px-3 py-2 focus:outline-none resize-none" style={{ borderColor: "#d8cfc3" }}
                  rows={4} placeholder={"初次評估\n開立方案\n第1週追蹤\n成效評估"} />
              </div>
            </div>
          ) : previewSteps.length > 0 && (
            <p className="text-xs leading-relaxed" style={{ color: "#b3a99d" }}>步驟：{previewSteps.filter(s => !s.startsWith("§ ")).join(" → ")}</p>
          )}
          <div>
            <p className="text-xs mb-1" style={{ color: "#8b8076" }}>備注（選填）</p>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
              className="w-full text-sm border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 resize-none"
              style={{ borderColor: "#d8cfc3" }} rows={2}
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
          <p className="text-xs font-semibold uppercase tracking-[.08em]" style={{ color: "#b3a99d" }}>歷史週期（{pastCycles.length}）</p>
          {pastCycles.map((cycle) => {
            const num = cycleNumber(cycle.id);
            const actionSteps = cycle.steps.filter((s) => !s.label.startsWith("§ "));
            const completedCount = actionSteps.filter((s) => s.isCompleted).length;
            const expanded = expandedCycles.has(cycle.id);
            return (
              <div key={cycle.id} className="border rounded-sm overflow-hidden" style={{ borderColor: "#ece5da" }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#f3ece0" }}>
                  <span className="text-xs" style={{ color: "#8b8076" }}>#{num}</span>
                  <span className="text-sm font-medium" style={{ color: "#3b332c" }}>{cycle.type}</span>
                  <span className="text-xs" style={{ color: "#b3a99d" }}>{formatDate(cycle.startDate).slice(0, 7)}</span>
                  <span className="text-xs rounded-sm px-1.5 py-0.5" style={{ background: "#ece5da", color: "#8b8076" }}>
                    {completedCount}/{actionSteps.length} 完成
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => toggleExpandCycle(cycle.id)}
                      className="text-xs flex items-center gap-1" style={{ color: "#8b8076" }}>
                      {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}步驟
                    </button>
                    <button onClick={() => deleteCycle(cycle.id)} className="flex items-center gap-1 text-xs" style={{ color: "#b8392c" }}>
                      <Trash2 className="w-3 h-3" />刪除
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div style={{ borderTop: "1px solid #ece5da" }}>
                    {cycle.steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3 px-4 py-2 group" style={{ borderBottom: "1px solid #ece5da" }}>
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", step.isCompleted ? "bg-[#5c4638]" : "bg-[#d8cfc3]")} />
                        <span className="text-sm flex-1" style={{ color: step.isCompleted ? "#8b8076" : "#3b332c", textDecoration: step.isCompleted ? "line-through" : "none" }}>
                          {step.label}
                        </span>
                        {step.note && <span className="text-xs" style={{ color: "#b3a99d" }}>{step.note}</span>}
                        <button onClick={() => deleteStep(cycle.id, step.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1" style={{ color: "#b8392c" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {cycle.notes && (
                      <div className="px-4 py-2.5 text-xs" style={{ background: "#f3ece0", borderTop: "1px solid #ece5da", color: "#6b6056" }}>
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

// ─── QuestionnaireTab ────────────────────────────────────────────────────────
function QuestionnaireTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const SCORE_LABELS = ["睡眠", "精力", "消化", "情緒", "疼痛"] as const;
  type ScoreKey = "sleep" | "energy" | "digestion" | "mood" | "pain";
  const scoreKeys: ScoreKey[] = ["sleep", "energy", "digestion", "mood", "pain"];
  const [form, setForm] = useState<Record<string, string>>({ date: new Date().toISOString().slice(0, 10), chiefComplaint: "", healthGoals: "", symptoms: "", diet: "", exercise: "", stress: "", currentMeds: "", medicalHistory: "", allergies: "", expectations: "", notes: "", sleep: "", energy: "", digestion: "", mood: "", pain: "" });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/clients/${client.id}/questionnaires`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setShowForm(false); onRefresh();
  };

  const scoreColor = (v: number | null) => v === null ? "#d8cfc3" : v >= 8 ? "#5c4638" : v >= 5 ? "#E8A000" : "#b8392c";

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>{showForm ? "取消" : "+ 新增問卷"}</Button>
      </div>
      {showForm && (
        <div className="border rounded-sm p-4 flex flex-col gap-4" style={{ background: "#f3ece0", borderColor: "#ece5da" }}>
          <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>新增健康問卷</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="text-sm border rounded-sm px-2 py-1.5 w-48" style={{ borderColor: "#d8cfc3" }} />
            <textarea placeholder="主訴 / 主要症狀" value={form.chiefComplaint} onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <textarea placeholder="健康目標" value={form.healthGoals} onChange={(e) => setForm((f) => ({ ...f, healthGoals: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <div className="grid grid-cols-5 gap-2">
              {scoreKeys.map((key, i) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-center" style={{ color: "#8b8076" }}>{SCORE_LABELS[i]}</label>
                  <input type="number" min={0} max={10} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="text-sm border rounded-sm px-2 py-1 text-center w-full" style={{ borderColor: "#d8cfc3" }} />
                </div>
              ))}
            </div>
            <textarea placeholder="飲食習慣" value={form.diet} onChange={(e) => setForm((f) => ({ ...f, diet: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <textarea placeholder="運動習慣" value={form.exercise} onChange={(e) => setForm((f) => ({ ...f, exercise: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <textarea placeholder="目前用藥" value={form.currentMeds} onChange={(e) => setForm((f) => ({ ...f, currentMeds: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <textarea placeholder="過敏史" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <textarea placeholder="備注" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "儲存中..." : "儲存"}</Button></div>
          </form>
        </div>
      )}
      {client.questionnaires.length === 0 && !showForm && (
        <div className="text-center py-12 text-sm" style={{ color: "#b3a99d" }}>尚無健康問卷紀錄</div>
      )}
      {client.questionnaires.map((q) => (
        <div key={q.id} className="border rounded-sm overflow-hidden" style={{ borderColor: "#ece5da" }}>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ background: "#f3ece0" }}
            onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
            <span className="text-sm font-medium" style={{ color: "#241f1b" }}>{formatDate(q.date)}</span>
            <span className="text-sm flex-1 truncate" style={{ color: "#6b6056" }}>{q.chiefComplaint || "—"}</span>
            <div className="flex gap-1">
              {scoreKeys.map((key) => {
                const val = q[key as ScoreKey];
                return <span key={key} className="w-6 h-6 text-xs rounded-sm flex items-center justify-center text-white font-medium"
                  style={{ background: scoreColor(val) }}>{val ?? "?"}</span>;
              })}
            </div>
            {expanded === q.id ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#b3a99d" }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#b3a99d" }} />}
          </button>
          {expanded === q.id && (
            <div className="px-4 py-3 flex flex-col gap-2 text-sm" style={{ borderTop: "1px solid #ece5da" }}>
              {q.healthGoals && <p><span className="font-medium" style={{ color: "#8b8076" }}>健康目標：</span>{q.healthGoals}</p>}
              {q.diet && <p><span className="font-medium" style={{ color: "#8b8076" }}>飲食：</span>{q.diet}</p>}
              {q.exercise && <p><span className="font-medium" style={{ color: "#8b8076" }}>運動：</span>{q.exercise}</p>}
              {q.currentMeds && <p><span className="font-medium" style={{ color: "#8b8076" }}>用藥：</span>{q.currentMeds}</p>}
              {q.allergies && <p><span className="font-medium" style={{ color: "#8b8076" }}>過敏：</span>{q.allergies}</p>}
              {q.notes && <p><span className="font-medium" style={{ color: "#8b8076" }}>備注：</span>{q.notes}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── FunctionalMatrixTab ─────────────────────────────────────────────────────
const FM_SYSTEMS = [
  { key: "cardiovascular", label: "心血管系統" },
  { key: "nutritional", label: "營養與代謝" },
  { key: "environmental", label: "環境毒素" },
  { key: "endocrine", label: "內分泌" },
  { key: "gut", label: "腸道健康" },
  { key: "neurological", label: "神經認知" },
  { key: "methylation", label: "甲基化" },
] as const;

const TIMELINE_CATEGORIES = [
  { value: "symptom_onset", label: "症狀出現" },
  { value: "diagnosis", label: "診斷" },
  { value: "treatment_start", label: "治療開始" },
  { value: "test_result", label: "檢測結果" },
  { value: "lifestyle_change", label: "生活方式改變" },
  { value: "other", label: "其他" },
];

function FunctionalMatrixTab({ client, onRefresh }: { client: Client; onRefresh: () => void }) {
  const [matrix, setMatrix] = useState<FunctionalMatrix>(client.functionalMatrix ?? { cardiovascular: null, nutritional: null, environmental: null, endocrine: null, gut: null, neurological: null, methylation: null });
  const [saving, setSaving] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineForm, setTimelineForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "symptom_onset", title: "", description: "" });
  const [events, setEvents] = useState<HealthTimelineEvent[]>(client.timelineEvents ?? []);

  const saveMatrix = async () => {
    setSaving(true);
    await fetch(`/api/clients/${client.id}/matrix`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(matrix) });
    setSaving(false); onRefresh();
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clients/${client.id}/timeline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(timelineForm) });
    const data = await res.json();
    setEvents((prev) => [data, ...prev]);
    setShowTimelineForm(false);
    setTimelineForm({ date: new Date().toISOString().slice(0, 10), category: "symptom_onset", title: "", description: "" });
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/clients/${client.id}/timeline/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      {/* 功能醫學矩陣 */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#ece5da" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#ece2d6", borderBottom: "1px solid #d8cabb" }}>
          <p className="text-sm font-semibold" style={{ color: "#5c4638" }}>功能醫學矩陣</p>
          <button onClick={saveMatrix} disabled={saving}
            className="text-xs px-3 py-1 rounded-sm text-white" style={{ background: saving ? "#d8cfc3" : "#5c4638" }}>
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3">
          {FM_SYSTEMS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6b6056" }}>{label}</label>
              <textarea
                value={matrix[key as keyof FunctionalMatrix] ?? ""}
                onChange={(e) => setMatrix((m) => ({ ...m, [key]: e.target.value || null }))}
                className="w-full text-sm border rounded-sm px-3 py-2 resize-none focus:outline-none"
                style={{ borderColor: "#d8cfc3" }} rows={2}
                placeholder={`${label}相關症狀、指標、觀察...`} />
            </div>
          ))}
        </div>
      </div>

      {/* 症狀時間軸 */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#ece5da" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}>
          <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>症狀時間軸</p>
          <button onClick={() => setShowTimelineForm(!showTimelineForm)}
            className="text-xs px-3 py-1 rounded-sm border transition-colors"
            style={{ borderColor: showTimelineForm ? "#5c4638" : "#d8cfc3", color: showTimelineForm ? "#5c4638" : "#6b6056" }}>
            {showTimelineForm ? "取消" : "+ 新增事件"}
          </button>
        </div>
        {showTimelineForm && (
          <form onSubmit={addEvent} className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: "1px solid #ece5da", background: "#f3ece0" }}>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={timelineForm.date} onChange={(e) => setTimelineForm((f) => ({ ...f, date: e.target.value }))}
                className="text-sm border rounded-sm px-2 py-1.5" style={{ borderColor: "#d8cfc3" }} />
              <select value={timelineForm.category} onChange={(e) => setTimelineForm((f) => ({ ...f, category: e.target.value }))}
                className="text-sm border rounded-sm px-2 py-1.5" style={{ borderColor: "#d8cfc3" }}>
                {TIMELINE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <input placeholder="標題 *" value={timelineForm.title} onChange={(e) => setTimelineForm((f) => ({ ...f, title: e.target.value }))}
              className="text-sm border rounded-sm px-2 py-1.5 w-full" style={{ borderColor: "#d8cfc3" }} required />
            <textarea placeholder="詳細說明（選填）" value={timelineForm.description} onChange={(e) => setTimelineForm((f) => ({ ...f, description: e.target.value }))}
              className="text-sm border rounded-sm px-3 py-2 w-full resize-none" style={{ borderColor: "#d8cfc3" }} rows={2} />
            <div className="flex justify-end"><button type="submit" className="text-xs px-3 py-1 rounded-sm text-white" style={{ background: "#5c4638" }}>新增</button></div>
          </form>
        )}
        {events.length === 0 && (
          <div className="text-center py-10 text-sm" style={{ color: "#b3a99d" }}>尚無時間軸事件</div>
        )}
        <div className="px-4 py-3 flex flex-col gap-3">
          {events.map((ev) => {
            const cat = TIMELINE_CATEGORIES.find((c) => c.value === ev.category);
            return (
              <div key={ev.id} className="flex items-start gap-3 group">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full mt-0.5" style={{ background: "#5c4638" }} />
                  <div className="flex-1 w-px mt-1" style={{ background: "#d8cfc3", minHeight: "24px" }} />
                </div>
                <div className="flex-1 min-w-0 pb-3" style={{ borderBottom: "1px solid #ece5da" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#8b8076" }}>{formatDate(ev.date)}</span>
                    {cat && <span className="text-[10px] px-1.5 py-0.5 rounded-sm" style={{ background: "#ece2d6", color: "#5c4638" }}>{cat.label}</span>}
                  </div>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "#241f1b" }}>{ev.title}</p>
                  {ev.description && <p className="text-xs mt-0.5" style={{ color: "#6b6056" }}>{ev.description}</p>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0" style={{ color: "#b8392c" }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ComplaintsTab ───────────────────────────────────────────────────────────
const COMPLAINT_STATUS = [
  { value: "open", label: "處理中" },
  { value: "resolved", label: "已解決" },
  { value: "closed", label: "已結案" },
];

function ComplaintsTab({ client, showForm, setShowForm, onRefresh }: { client: Client; showForm: boolean; setShowForm: (v: boolean) => void; onRefresh: () => void; }) {
  const [complaints, setComplaints] = useState<Complaint[]>(client.complaints ?? []);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), clientWords: "", process: "", emotionIssue: "", actualIssue: "", replyGiven: "", promisedActions: "", promisedDeadline: "", followUpResult: "", internalSuggestion: "", status: "open" });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}/complaints`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setComplaints((prev) => [data, ...prev]);
    setSaving(false); setShowForm(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/clients/${client.id}/complaints/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  const deleteComplaint = async (id: string) => {
    await fetch(`/api/clients/${client.id}/complaints/${id}`, { method: "DELETE" });
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  };

  const LEAP_FIELDS = [
    { key: "clientWords",       label: "L — Listen（傾聽）",         placeholder: "客戶原話（逐字或摘要）" },
    { key: "process",           label: "  流程說明",                   placeholder: "事發過程" },
    { key: "emotionIssue",     label: "E — Empathize（情緒層面）",   placeholder: "情緒/感受問題" },
    { key: "actualIssue",      label: "A — Analyze（實質問題）",     placeholder: "實際核心問題" },
    { key: "replyGiven",       label: "P — Plan（當下回覆）",        placeholder: "已給予的回覆" },
    { key: "promisedActions",  label: "  承諾的具體行動",             placeholder: "具體改善行動" },
    { key: "followUpResult",   label: "  後續追蹤結果",               placeholder: "後續確認結果" },
    { key: "internalSuggestion", label: "內部改善建議",              placeholder: "系統/流程改善建議" },
  ] as const;

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>{showForm ? "取消" : "+ 新增客訴"}</Button>
      </div>
      {showForm && (
        <div className="border rounded-sm p-4 flex flex-col gap-3" style={{ background: "#f3ece0", borderColor: "#ece5da" }}>
          <p className="text-sm font-semibold" style={{ color: "#241f1b" }}>新增客訴記錄（LEAP 模型）</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="text-sm border rounded-sm px-2 py-1.5" style={{ borderColor: "#d8cfc3" }} />
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="text-sm border rounded-sm px-2 py-1.5" style={{ borderColor: "#d8cfc3" }}>
                {COMPLAINT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            {LEAP_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1" style={{ color: "#6b6056" }}>{label}</label>
                <textarea value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-sm border rounded-sm px-3 py-2 resize-none" style={{ borderColor: "#d8cfc3" }} rows={2}
                  placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6b6056" }}>承諾期限</label>
              <input type="date" value={form.promisedDeadline} onChange={(e) => setForm((f) => ({ ...f, promisedDeadline: e.target.value }))}
                className="text-sm border rounded-sm px-2 py-1.5" style={{ borderColor: "#d8cfc3" }} />
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "儲存中..." : "儲存"}</Button></div>
          </form>
        </div>
      )}
      {complaints.length === 0 && !showForm && (
        <div className="text-center py-12 text-sm" style={{ color: "#b3a99d" }}>尚無客訴記錄</div>
      )}
      {complaints.map((c) => {
        const statusMeta = COMPLAINT_STATUS.find((s) => s.value === c.status);
        const isOpen = expanded === c.id;
        return (
          <div key={c.id} className="border rounded-sm overflow-hidden" style={{ borderColor: c.status === "open" ? "#E8C4A0" : "#ece5da" }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: c.status === "open" ? "#FDF6EF" : "#f3ece0" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: c.status === "open" ? "#E8A000" : "#b3a99d" }} />
              <span className="text-sm font-medium flex-1 truncate" style={{ color: "#241f1b" }}>{c.clientWords?.slice(0, 40) || `客訴 ${formatDate(c.date)}`}</span>
              <span className="text-xs" style={{ color: "#8b8076" }}>{formatDate(c.date)}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: c.status === "open" ? "#FDEBD0" : "#ece5da", color: c.status === "open" ? "#E8A000" : "#8b8076" }}>
                {statusMeta?.label}
              </span>
              <button onClick={() => setExpanded(isOpen ? null : c.id)} style={{ color: "#b3a99d" }}>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {isOpen && (
              <div className="px-4 py-3 flex flex-col gap-2 text-sm" style={{ borderTop: "1px solid #ece5da" }}>
                {LEAP_FIELDS.filter(({ key }) => c[key as keyof Complaint]).map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#8b8076" }}>{label}</p>
                    <p style={{ color: "#241f1b" }}>{c[key as keyof Complaint] as string}</p>
                  </div>
                ))}
                {c.promisedDeadline && <p><span className="text-xs font-medium" style={{ color: "#8b8076" }}>承諾期限：</span>{formatDate(c.promisedDeadline)}</p>}
                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid #ece5da" }}>
                  <span className="text-xs" style={{ color: "#8b8076" }}>狀態：</span>
                  {COMPLAINT_STATUS.map((s) => (
                    <button key={s.value} onClick={() => updateStatus(c.id, s.value)}
                      className="text-xs px-2 py-0.5 rounded-sm border transition-colors"
                      style={c.status === s.value ? { background: "#5c4638", color: "#fff", borderColor: "#5c4638" } : { borderColor: "#d8cfc3", color: "#6b6056" }}>
                      {s.label}
                    </button>
                  ))}
                  <button onClick={() => deleteComplaint(c.id)} className="ml-auto text-xs" style={{ color: "#b8392c" }}>刪除</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
