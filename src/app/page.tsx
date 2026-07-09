export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, Users, ClipboardList, AlertCircle, CheckCircle2, Bell, Bookmark, Truck } from "lucide-react";

type ExpiringRx = {
  id: string;
  runOutDate: string;
  client: { id: string; name: string; needsAttention: boolean } | null;
};

type UnshippedRx = {
  id: string;
  date: string;
  status: string;
  client: { id: string; name: string; needsAttention: boolean } | null;
};

async function getDashboardData() {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59);

  const [tasksRes, overdueRes, clientsRes, totalRes, expiringRxRes, consultationsRes, unshippedRxRes] = await Promise.all([
    supabase
      .from("Task")
      .select("*, client:Client(id, name)")
      .neq("status", "done")
      .lte("dueDate", todayEnd.toISOString())
      .order("dueDate", { ascending: true })
      .limit(20),
    supabase
      .from("Task")
      .select("id", { count: "exact" })
      .neq("status", "done")
      .lt("dueDate", todayStart.toISOString()),
    supabase
      .from("Client")
      .select("id, name, updatedAt")
      .eq("isActive", true)
      .order("updatedAt", { ascending: false })
      .limit(5),
    supabase
      .from("Client")
      .select("id", { count: "exact" })
      .eq("isActive", true),
    supabase
      .from("Prescription")
      .select("id, runOutDate, client:Client(id, name, needsAttention)")
      .eq("status", "active")
      .not("runOutDate", "is", null)
      .lte("runOutDate", twoWeeksLater.toISOString())
      .order("runOutDate", { ascending: true })
      .limit(20),
    supabase
      .from("Consultation")
      .select("id", { count: "exact" })
      .gte("date", monthStart.toISOString())
      .lte("date", monthEnd.toISOString()),
    supabase
      .from("Prescription")
      .select("id, date, status, client:Client(id, name, needsAttention)")
      .in("status", ["packing", "packing_done"])
      .order("date", { ascending: true })
      .limit(20),
  ]);

  return {
    todayTasks: tasksRes.data || [],
    overdueTasks: overdueRes.count || 0,
    recentClients: clientsRes.data || [],
    totalClients: totalRes.count || 0,
    expiringPrescriptions: (expiringRxRes.data || []) as unknown as ExpiringRx[],
    monthlyConsultations: consultationsRes.count || 0,
    unshippedPrescriptions: (unshippedRxRes.data || []) as unknown as UnshippedRx[],
  };
}

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default async function DashboardPage() {
  const { todayTasks, overdueTasks, recentClients, totalClients, expiringPrescriptions, monthlyConsultations, unshippedPrescriptions } =
    await getDashboardData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = todayTasks.filter((t) => t.dueDate && new Date(t.dueDate) < today);
  const todayOnly = todayTasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= today);

  // Annotate prescriptions with days remaining
  const rxWithDays = expiringPrescriptions.map((rx) => ({
    ...rx,
    daysLeft: Math.ceil((new Date(rx.runOutDate).getTime() - today.getTime()) / 86400000),
  }));
  const overdueRx = rxWithDays.filter((rx) => rx.daysLeft < 0);
  const upcomingRx = rxWithDays.filter((rx) => rx.daysLeft >= 0);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#241f1b" }}>今日待辦</h1>
        <p className="text-sm mt-0.5" style={{ color: "#8b8076" }}>
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric", month: "long", day: "numeric", weekday: "long",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<ClipboardList className="w-5 h-5" style={{ color: "#5c4638" }} />}
          label="今日任務" value={todayTasks.length} accent="#ece2d6" />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="逾期任務" value={overdueTasks} accent="#FEF2F2" />
        <StatCard
          icon={<Users className="w-5 h-5" style={{ color: "#5c4638" }} />}
          label="客戶總數" value={totalClients} accent="#ece2d6" />
        <StatCard
          icon={<Bell className="w-5 h-5 text-amber-500" />}
          label="處方待追蹤" value={expiringPrescriptions.length} accent="#FFFBF0"
          highlight={expiringPrescriptions.length > 0} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Overdue tasks */}
          {overdue.length > 0 && (
            <Card>
              <CardHeader style={{ background: "#FEF2F2" }}>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" /> 逾期任務 ({overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0"><TaskList tasks={overdue} /></CardContent>
            </Card>
          )}

          {/* Today tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "#5c4638" }} />
                今日任務 ({todayOnly.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todayOnly.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm" style={{ color: "#b3a99d" }}>今日沒有待辦任務 🎉</p>
              ) : (
                <TaskList tasks={todayOnly} />
              )}
            </CardContent>
          </Card>

          {/* Prescription expiry reminders */}
          {rxWithDays.length > 0 && (
            <Card style={{ border: "1px solid #F6D860" }}>
              <CardHeader style={{ background: "#FFFBF0", borderBottom: "1px solid #FEF08A" }}>
                <CardTitle className="flex items-center gap-2" style={{ color: "#92400E" }}>
                  <Bell className="w-4 h-4 text-amber-500" />
                  保健品即將用完
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full ml-1"
                    style={{ background: "#FEF3C7", color: "#B45309" }}>
                    {rxWithDays.length} 位客戶
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {overdueRx.length > 0 && (
                  <div className="px-5 py-2 text-xs font-semibold" style={{ color: "#DC2626", background: "#FFF5F5", borderBottom: "1px solid #FEE2E2" }}>
                    已超過預計用完日
                  </div>
                )}
                {overdueRx.map((rx) => (
                  <RxReminderRow key={rx.id} rx={rx} />
                ))}
                {overdueRx.length > 0 && upcomingRx.length > 0 && (
                  <div className="px-5 py-2 text-xs font-semibold" style={{ color: "#D97706", background: "#FFFBF0", borderBottom: "1px solid #FEF3C7", borderTop: "1px solid #FEF3C7" }}>
                    14 天內到期
                  </div>
                )}
                {upcomingRx.map((rx) => (
                  <RxReminderRow key={rx.id} rx={rx} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unshipped prescription reminders */}
          {unshippedPrescriptions.length > 0 && (
            <Card style={{ border: "1px solid #93C5FD" }}>
              <CardHeader style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE" }}>
                <CardTitle className="flex items-center gap-2" style={{ color: "#1D4ED8" }}>
                  <Truck className="w-4 h-4" style={{ color: "#3B82F6" }} />
                  保健品待寄出
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full ml-1"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                    {unshippedPrescriptions.length} 筆
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {unshippedPrescriptions.map((rx) => {
                  const daysSince = Math.floor((today.getTime() - new Date(rx.date).getTime()) / 86400000);
                  return (
                    <Link key={rx.id} href={`/clients/${rx.client?.id}`}
                      className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-blue-50"
                      style={{ borderBottom: "1px solid #DBEAFE" }}>
                      <div className="flex items-center gap-2">
                        {rx.client?.needsAttention && (
                          <Bookmark className="w-3 h-3 flex-shrink-0" fill="#D97706" style={{ color: "#D97706" }} />
                        )}
                        <span className="text-sm font-medium" style={{ color: "#241f1b" }}>
                          {rx.client?.name ?? "—"}
                        </span>
                        <Badge variant={rx.status === "packing_done" ? "info" : "default"}>
                          {rx.status === "packing_done" ? "打包完成" : "正在包裝"}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium" style={{ color: daysSince >= 3 ? "#DC2626" : "#1D4ED8" }}>
                        開立 {daysSince} 天{daysSince >= 3 ? "，儘快寄出" : ""}
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近客戶</CardTitle>
                <Link href="/clients" className="text-xs hover:underline" style={{ color: "#5c4638" }}>查看全部</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#241f1b" }}>{client.name}</p>
                    <p className="text-xs" style={{ color: "#b3a99d" }}>{formatDateTime(client.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Monthly summary */}
          <Card>
            <CardHeader>
              <CardTitle>本月概況</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6b6056" }}>諮詢次數</span>
                <span className="font-semibold" style={{ color: "#241f1b" }}>{monthlyConsultations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6b6056" }}>客戶總數</span>
                <span className="font-semibold" style={{ color: "#241f1b" }}>{totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6b6056" }}>處方待追蹤</span>
                <span className="font-semibold" style={{ color: expiringPrescriptions.length > 0 ? "#D97706" : "#241f1b" }}>
                  {expiringPrescriptions.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RxReminderRow({ rx }: { rx: ExpiringRx & { daysLeft: number } }) {
  const isOverdue = rx.daysLeft < 0;
  const isUrgent = rx.daysLeft >= 0 && rx.daysLeft <= 3;
  const color = isOverdue ? "#DC2626" : isUrgent ? "#D97706" : "#92400E";

  return (
    <Link href={`/clients/${rx.client?.id}`}
      className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-amber-50"
      style={{ borderBottom: "1px solid #FEF3C7" }}>
      <div className="flex items-center gap-2">
        {rx.client?.needsAttention && (
          <Bookmark className="w-3 h-3 flex-shrink-0" fill="#D97706" style={{ color: "#D97706" }} />
        )}
        <span className="text-sm font-medium" style={{ color: "#241f1b" }}>
          {rx.client?.name ?? "—"}
        </span>
      </div>
      <span className="text-xs font-medium" style={{ color }}>
        {isOverdue
          ? `已超過 ${-rx.daysLeft} 天`
          : rx.daysLeft === 0
          ? "今日用完"
          : `${rx.daysLeft} 天後用完`}
      </span>
    </Link>
  );
}

function StatCard({
  icon, label, value, accent, highlight,
}: {
  icon: React.ReactNode; label: string; value: number | string; accent: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-sm p-4" style={{ background: accent, border: `1px solid ${highlight ? "#F6D860" : "#ece5da"}` }}>
      <div className="mb-1">{icon}</div>
      <p className="text-2xl font-bold" style={{ color: highlight ? "#92400E" : "#241f1b" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "#8b8076" }}>{label}</p>
    </div>
  );
}

function TaskList({ tasks }: {
  tasks: Array<{
    id: string; title: string; priority: string; dueDate: string | null;
    category: string | null; client: { id: string; name: string } | null;
  }>;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task.id} className="px-5 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate" style={{ color: "#241f1b" }}>{task.title}</p>
              <Badge variant={priorityVariant[task.priority] || "default"}>{PRIORITY_LABELS[task.priority]}</Badge>
              {task.category && <Badge variant="outline">{CATEGORY_LABELS[task.category] || task.category}</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {task.client && (
                <Link href={`/clients/${task.client.id}`} className="text-xs hover:underline" style={{ color: "#5c4638" }}>
                  {task.client.name}
                </Link>
              )}
              {task.dueDate && <span className="text-xs" style={{ color: "#b3a99d" }}>{formatDate(task.dueDate)}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
