"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function TaskDeleteButton({ taskId }: { taskId: string }) {
  const router = useRouter();

  const del = async () => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <button onClick={del} className="p-1 rounded hover:opacity-70 flex-shrink-0" style={{ color: "#c8574a" }} title="刪除">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
