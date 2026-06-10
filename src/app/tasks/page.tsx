export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { formatDate, PRIORITY_LABELS, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import TaskStatusToggle from "@/components/TaskStatusToggle";

async function getTasks() {
  const { data } = await supabase
    .from("Task")
    .select("*, client:Client(id, name)")
    .order("status", { ascending: true })
    .order("dueDate", { ascending: true });
  return data || [];
}

const priorityVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger", medium: "warning", low: "info",
};

export default async function TasksPage() {
  const tasks = await getTasks();
  const pending = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />任務清單
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">待處理 {pending.length} 筆 / 已完成 {done.length} 筆</p>
      </div>

      <div className="flex flex-col gap-4">
        {pending.length === 0 && done.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">尚無任務</div>
        )}
        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-2">待處理</h2>
            <Card>
              <ul className="divide-y divide-slate-100">
                {pending.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 px-5 py-3">
                    <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800">{task.title}</p>
                        <Badge variant={priorityVariant[task.priority] || "default"}>{PRIORITY_LABELS[task.priority]}</Badge>
                        {task.category && <Badge variant="outline">{CATEGORY_LABELS[task.category] || task.category}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {task.client && (
                          <Link href={`/clients/${task.client.id}`} className="text-xs text-blue-600 hover:underline">{task.client.name}</Link>
                        )}
                        {task.dueDate && <span className="text-xs text-slate-400">截止：{formatDate(task.dueDate)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">已完成</h2>
            <Card>
              <ul className="divide-y divide-slate-100">
                {done.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 px-5 py-3 opacity-60">
                    <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
                    <p className="text-sm text-slate-400 line-through">{task.title}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
