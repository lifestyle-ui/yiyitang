export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, Users, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";

async function getDashboardData() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const [todayTasks, overdueTasks, recentClients, totalClients] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { not: "done" },
        dueDate: { lte: today },
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 20,
    }),
    prisma.task.count({
      where: {
        status: { not: "done" },
        dueDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.client.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { tasks: { where: { status: { not: "done" } } } } },
      },
    }),
    prisma.client.count({ where: { isActive: true } }),
  ]);

  return { todayTasks, overdueTasks, recentClients, totalClients };
}

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default async function DashboardPage() {
  const { todayTasks, overdueTasks, recentClients, totalClients } =
    await getDashboardData();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdue = todayTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now
  );
  const todayOnly = todayTasks.filter(
    (t) => !t.dueDate || new Date(t.dueDate) >= now
  );

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">今日待辦</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          label="今日任務"
          value={todayTasks.length}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="逾期任務"
          value={overdueTasks}
          bg="bg-red-50"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-600" />}
          label="客戶總數"
          value={totalClients}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          label="本月諮詢"
          value="—"
          bg="bg-purple-50"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* 任務清單 */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {overdue.length > 0 && (
            <Card>
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> 逾期任務 ({overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TaskList tasks={overdue} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                今日任務 ({todayOnly.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todayOnly.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  今日沒有待辦任務 🎉
                </p>
              ) : (
                <TaskList tasks={todayOnly} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 最近客戶 */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近客戶</CardTitle>
                <Link
                  href="/clients"
                  className="text-xs text-blue-600 hover:underline"
                >
                  查看全部
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(client.updatedAt)}
                    </p>
                  </div>
                  {client._count.tasks > 0 && (
                    <Badge variant="warning">{client._count.tasks} 任務</Badge>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${bg} border border-white`}>
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function TaskList({
  tasks,
}: {
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: Date | null;
    category: string | null;
    client: { id: string; name: string } | null;
  }>;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task.id} className="px-5 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-slate-800 truncate">
                {task.title}
              </p>
              <Badge variant={priorityVariant[task.priority] || "default"}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
              {task.category && (
                <Badge variant="outline">
                  {CATEGORY_LABELS[task.category] || task.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {task.client && (
                <Link
                  href={`/clients/${task.client.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {task.client.name}
                </Link>
              )}
              {task.dueDate && (
                <span className="text-xs text-slate-400">
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
