"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AISummaryButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const generate = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      setSummary(data.summary || "無法生成摘要");
    } catch {
      setSummary("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={generate}>
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        AI 摘要
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI 健康摘要
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-500">AI 分析中...</p>
              </div>
            ) : (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>
            )}
            <div className="flex justify-end mt-4 gap-2">
              {!loading && (
                <Button variant="secondary" size="sm" onClick={generate}>
                  重新生成
                </Button>
              )}
              <Button size="sm" onClick={() => setOpen(false)}>
                關閉
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
