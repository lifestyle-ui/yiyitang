"use client";

import { useRouter } from "next/navigation";

export default function TaskStatusToggle({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const toggle = async () => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: currentStatus === "done" ? "pending" : "done",
      }),
    });
    router.refresh();
  };

  return (
    <input
      type="checkbox"
      checked={currentStatus === "done"}
      onChange={toggle}
      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
    />
  );
}
