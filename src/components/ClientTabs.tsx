"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  FlaskConical,
  Pill,
  ClipboardList,
  MessageCircle,
  Stethoscope,
  Heart,
} from "lucide-react";
import { cn, formatDate, formatDateTime, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type Client = {
  id: string;
  name: string;
  consultations: Consultation[];
  labTests: LabTest[];
  prescriptions: Prescription[];
  tasks: Task[];
  lineTrackings: LineTracking[];
  doctorNotes: DoctorNote[];
  healthPlans: HealthPlan[];
};

type Consultation = {
  id: string; date: string; chiefComplaint: string | null;
  content: string | null; doctorAdvice: string | null; nextSteps: string | null;
};
type LabTest = {
  id: string; testDate: string | null; testType: string; status: string;
  findings: string | null; doctorInterpretation: string | null; staffExplanation: string | null;
};
type Prescription = {
  id: string; date: string; items: unknown; totalDays: number | null;
  runOutDate: string | null; status: string; notes: string | null;
};
type Task = {
  id: string; title: string; description: string | null; dueDate: string | null;
  priority: string; status: string; category: string | null; assignedTo: string | null;
};
type LineTracking = {
  id: string; date: string; content: string; response: string | null; followUpNeeded: boolean;
};
type DoctorNote = {
  id: string; date: string; diagnosis: string | null; treatment: string | null;
  prescription: string | null; notes: string | null; nextVisit: string | null;
};
type HealthPlan = {
  id: string; title: string; startDate: string; endDate: string | null;
  goals: string | null; status: string; progress: string | null;
};

const TABS = [
  { key: "consultations", label: "諮詢記錄", icon: MessageSquare },
  { key: "doctorNotes", label: "醫師處置", icon: Stethoscope },
  { key: "labTests", label: "檢測", icon: FlaskConical },
  { key: "prescriptions", label: "保健品處方", icon: Pill },
  { key: "tasks", label: "任務", icon: ClipboardList },
  { key: "lineTrackings", label: "LINE 追蹤", icon: MessageCircle },
  { key: "healthPlans", label: "健康計畫", icon: Heart },
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
      {/* Tab 列 */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = (client[tab.key as keyof Client] as unknown[]).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span className="ml-1 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "consultations" && (
          <ConsultationsTab
            client={client}
            showForm={showForm}
            setShowForm={setShowForm}
            onRefresh={() => router.refresh()}
          />
        )}
        {activeTab === "doctorNotes" && (
          <DoctorNotesTab
            client={client}
            showForm={showForm}
            setShowForm={setShowForm}
            onRefresh={() => router.refresh()}
          />
        )}
        {activeTab === "labTests" && (
          <LabTestsTab client={client} />
        )}
        {activeTab === "prescriptions" && (
          <PrescriptionsTab
            client={client}
            showForm={showForm}
            setShowForm={setShowForm}
            onRefresh={() => router.refresh()}
          />
        )}
        {activeTab === "tasks" && (
          <TasksTab
            client={client}
            showForm={showForm}
            setShowForm={setShowForm}
            onRefresh={() => router.refresh()}
          />
        )}
        {activeTab === "lineTrackings" && (
          <LineTrackingsTab
            client={client}
            showForm={showForm}
            setShowForm={setShowForm}
            onRefresh={() => router.refresh()}
          />
        )}
        {activeTab === "healthPlans" && (
          <HealthPlansTab client={client} />
        )}
      </div>
    </div>
  );
}

// ===== 諮詢記錄 =====
function ConsultationsTab({
  client, showForm, setShowForm, onRefresh,
}: {
  client: Client; showForm: boolean;
  setShowForm: (v: boolean) => void; onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    chiefComplaint: "", content: "", doctorAdvice: "", nextSteps: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}/consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "取消" : "+ 新增諮詢記錄"}
        </Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>新增諮詢記錄</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input label="諮詢日期" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea label="主訴 / 症狀" placeholder="客戶主要訴求..." value={form.chiefComplaint}
                onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))} rows={2} />
              <Textarea label="諮詢內容" placeholder="詳細討論內容..." value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
              <Textarea label="醫師建議" placeholder="醫師的建議與處置..." value={form.doctorAdvice}
                onChange={(e) => setForm((f) => ({ ...f, doctorAdvice: e.target.value }))} rows={2} />
              <Textarea label="後續步驟" placeholder="下一步行動..." value={form.nextSteps}
                onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.consultations.length === 0 && !showForm && (
        <EmptyState label="尚無諮詢記錄" />
      )}
      {client.consultations.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{formatDate(c.date)}</CardTitle>
              {c.chiefComplaint && <Badge variant="info">{c.chiefComplaint}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-sm">
              {c.content && <Field label="諮詢內容" value={c.content} />}
              {c.doctorAdvice && <Field label="醫師建議" value={c.doctorAdvice} />}
              {c.nextSteps && <Field label="後續步驟" value={c.nextSteps} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== 醫師處置 =====
function DoctorNotesTab({
  client, showForm, setShowForm, onRefresh,
}: {
  client: Client; showForm: boolean;
  setShowForm: (v: boolean) => void; onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    diagnosis: "", treatment: "", prescription: "", notes: "", nextVisit: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}/doctor-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
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
              <Input label="處置日期" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea label="診斷" placeholder="診斷結果..." value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={2} />
              <Textarea label="治療方式" placeholder="治療方式與處置..." value={form.treatment}
                onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={3} />
              <Textarea label="開立處方" placeholder="藥物或保健品處方..." value={form.prescription}
                onChange={(e) => setForm((f) => ({ ...f, prescription: e.target.value }))} rows={2} />
              <Textarea label="備註" placeholder="其他備注..." value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              <Input label="下次回診日期" type="date" value={form.nextVisit}
                onChange={(e) => setForm((f) => ({ ...f, nextVisit: e.target.value }))} />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.doctorNotes.length === 0 && !showForm && (
        <EmptyState label="尚無醫師處置記錄" />
      )}
      {client.doctorNotes.map((n) => (
        <Card key={n.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{formatDate(n.date)}</CardTitle>
              {n.nextVisit && (
                <Badge variant="info">下次回診：{formatDate(n.nextVisit)}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-sm">
              {n.diagnosis && <Field label="診斷" value={n.diagnosis} />}
              {n.treatment && <Field label="治療方式" value={n.treatment} />}
              {n.prescription && <Field label="處方" value={n.prescription} />}
              {n.notes && <Field label="備註" value={n.notes} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== 檢測 =====
function LabTestsTab({ client }: { client: Client }) {
  return (
    <div className="max-w-3xl flex flex-col gap-4">
      {client.labTests.length === 0 && <EmptyState label="尚無檢測記錄" />}
      {client.labTests.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.testType}</CardTitle>
              <div className="flex items-center gap-2">
                {t.testDate && <span className="text-sm text-slate-500">{formatDate(t.testDate)}</span>}
                <Badge variant={t.status === "completed" ? "success" : t.status === "scheduled" ? "info" : "default"}>
                  {STATUS_LABELS[t.status] || t.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-sm">
              {t.findings && <Field label="檢測結果" value={t.findings} />}
              {t.doctorInterpretation && <Field label="醫師判讀" value={t.doctorInterpretation} />}
              {t.staffExplanation && <Field label="健管師解說" value={t.staffExplanation} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== 保健品處方 =====
function PrescriptionsTab({
  client, showForm, setShowForm, onRefresh,
}: {
  client: Client; showForm: boolean;
  setShowForm: (v: boolean) => void; onRefresh: () => void;
}) {
  const [itemsText, setItemsText] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    totalDays: "", runOutDate: "", notes: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = itemsText
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ name: line.trim() }));
    setLoading(true);
    await fetch(`/api/clients/${client.id}/prescriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
  };

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
              <Input label="開立日期" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea
                label="保健品清單（每行一項）"
                placeholder={"魚油 2顆 早晚\n維生素D 1顆 早上\n益生菌 1包 睡前"}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                rows={5}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="總天數" type="number" placeholder="30" value={form.totalDays}
                  onChange={(e) => setForm((f) => ({ ...f, totalDays: e.target.value }))} />
                <Input label="預計用完日" type="date" value={form.runOutDate}
                  onChange={(e) => setForm((f) => ({ ...f, runOutDate: e.target.value }))} />
              </div>
              <Textarea label="備註" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.prescriptions.length === 0 && !showForm && (
        <EmptyState label="尚無保健品處方" />
      )}
      {client.prescriptions.map((p) => {
        const items = (p.items as { name: string }[]) || [];
        const isExpiringSoon =
          p.runOutDate &&
          new Date(p.runOutDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>開立日期：{formatDate(p.date)}</CardTitle>
                <div className="flex items-center gap-2">
                  {p.runOutDate && (
                    <Badge variant={isExpiringSoon ? "warning" : "default"}>
                      用完：{formatDate(p.runOutDate)}
                    </Badge>
                  )}
                  <Badge variant={p.status === "active" ? "success" : "default"}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-700 space-y-1 mb-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    {item.name}
                  </li>
                ))}
              </ul>
              {p.totalDays && (
                <p className="text-xs text-slate-400">共 {p.totalDays} 天</p>
              )}
              {p.notes && <p className="text-xs text-slate-500 mt-2">{p.notes}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ===== 任務 =====
function TasksTab({
  client, showForm, setShowForm, onRefresh,
}: {
  client: Client; showForm: boolean;
  setShowForm: (v: boolean) => void; onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "", priority: "medium", category: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
  };

  const updateStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
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
              <Input label="任務標題 *" placeholder="任務名稱..." value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <Textarea label="說明" placeholder="任務說明..." value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
              <div className="grid grid-cols-3 gap-4">
                <Input label="截止日期" type="date" value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
                <Select label="優先級" value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  options={[
                    { value: "high", label: "高" },
                    { value: "medium", label: "中" },
                    { value: "low", label: "低" },
                  ]} />
                <Select label="類別" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  options={[
                    { value: "follow_up", label: "追蹤" },
                    { value: "lab_test", label: "檢測" },
                    { value: "prescription_refill", label: "保健品補充" },
                    { value: "consultation", label: "諮詢" },
                  ]}
                  placeholder="請選擇" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.tasks.length === 0 && !showForm && <EmptyState label="尚無任務" />}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-slate-500">待處理 ({pending.length})</h3>
          {pending.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-slate-400">已完成 ({done.length})</h3>
          {done.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange }: {
  task: Task; onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className={cn(
      "bg-white border rounded-lg px-4 py-3 flex items-start gap-3",
      task.status === "done" ? "border-slate-100 opacity-60" : "border-slate-200"
    )}>
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onStatusChange(task.id, task.status === "done" ? "pending" : "done")}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-slate-400")}>
            {task.title}
          </p>
          <Badge variant={priorityVariant[task.priority] || "default"}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {task.category && (
            <Badge variant="outline">{CATEGORY_LABELS[task.category] || task.category}</Badge>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
        )}
        {task.dueDate && (
          <p className="text-xs text-slate-400 mt-0.5">截止：{formatDate(task.dueDate)}</p>
        )}
      </div>
    </div>
  );
}

// ===== LINE 追蹤 =====
function LineTrackingsTab({
  client, showForm, setShowForm, onRefresh,
}: {
  client: Client; showForm: boolean;
  setShowForm: (v: boolean) => void; onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    content: "", response: "", followUpNeeded: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/line-trackings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowForm(false);
    onRefresh();
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
              <Input label="日期" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Textarea label="追蹤內容 *" placeholder="記錄與客戶的 LINE 對話內容..." value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3} required />
              <Textarea label="客戶回應" placeholder="客戶的回覆..." value={form.response}
                onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))} rows={2} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.followUpNeeded}
                  onChange={(e) => setForm((f) => ({ ...f, followUpNeeded: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
                需要後續追蹤
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {client.lineTrackings.length === 0 && !showForm && (
        <EmptyState label="尚無 LINE 追蹤記錄" />
      )}
      {client.lineTrackings.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{formatDate(t.date)}</CardTitle>
              {t.followUpNeeded && <Badge variant="warning">需追蹤</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <Field label="內容" value={t.content} />
              {t.response && <Field label="客戶回應" value={t.response} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== 健康計畫 =====
function HealthPlansTab({ client }: { client: Client }) {
  return (
    <div className="max-w-3xl flex flex-col gap-4">
      {client.healthPlans.length === 0 && <EmptyState label="尚無健康計畫" />}
      {client.healthPlans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{plan.title}</CardTitle>
              <Badge variant={plan.status === "active" ? "success" : "default"}>
                {STATUS_LABELS[plan.status] || plan.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-xs text-slate-400">
                {formatDate(plan.startDate)}
                {plan.endDate && ` — ${formatDate(plan.endDate)}`}
              </p>
              {plan.goals && <Field label="目標" value={plan.goals} />}
              {plan.progress && <Field label="執行進度" value={plan.progress} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== 共用元件 =====
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-slate-400 text-sm">{label}</div>
  );
}
