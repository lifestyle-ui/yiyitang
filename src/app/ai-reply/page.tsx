"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, RefreshCw, Send, BookOpen, ChevronDown, ChevronRight, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KBEntry = { id: string; title: string; content: string; source: string | null; createdAt: string };
type FAQ = { id: string; question: string; answer: string | null; frequency: number };

// ─── Knowledge Base Panel ─────────────────────────────────────────────────────
function KnowledgeBasePanel() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", source: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const data = await fetch("/api/knowledge-base").then((r) => r.json());
    setEntries(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    await fetch("/api/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", content: "", source: "" });
    setAdding(false);
    setLoading(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    load();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setForm((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, ""), content: text, source: file.name }));
    setAdding(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">知識庫</p>
        <div className="flex gap-1.5">
          <button onClick={() => fileInputRef.current?.click()}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
            <Upload className="w-3 h-3" />上傳
          </button>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.docx" className="hidden" onChange={handleFile} />
          <button onClick={() => setAdding(true)}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
            <Plus className="w-3 h-3" />新增
          </button>
        </div>
      </div>

      {adding && (
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 flex flex-col gap-2">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="標題（必填）" className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none" autoFocus />
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="內容（必填）" rows={5}
            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none resize-none" />
          <input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder="來源說明（選填）" className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none" />
          <div className="flex justify-end gap-1.5">
            <button onClick={() => { setAdding(false); setForm({ title: "", content: "", source: "" }); }}
              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100">取消</button>
            <button onClick={submit} disabled={loading}
              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding && (
        <p className="text-xs text-slate-400 text-center py-4">尚無知識庫資料<br />點「新增」或「上傳」加入 SOP、Q&A 等文件</p>
      )}

      <div className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <div key={e.id} className="border border-slate-100 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
              {expandedId === e.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-xs font-medium text-slate-700 truncate">{e.title}</span>
              <button onClick={(ev) => { ev.stopPropagation(); remove(e.id); }}
                className="p-0.5 text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
            {expandedId === e.id && (
              <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap mt-2 max-h-40 overflow-y-auto font-sans">{e.content}</pre>
                {e.source && <p className="text-[10px] text-slate-400 mt-1">來源：{e.source}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ Panel ────────────────────────────────────────────────────────────────
function FAQPanel({ onSelect }: { onSelect: (q: string) => void }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await fetch("/api/faq").then((r) => r.json());
    setFaqs(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    await fetch("/api/ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "faq" }),
    });
    await load();
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">常見問題</p>
        <button onClick={generate} disabled={loading}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "分析中..." : "自動整理"}
        </button>
      </div>
      {faqs.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">點「自動整理」從歷史對話中提取常見問題</p>
      )}
      <div className="flex flex-col gap-1.5">
        {faqs.map((f) => (
          <button key={f.id} onClick={() => onSelect(f.question)}
            className="text-left border border-slate-100 rounded-lg px-3 py-2 hover:bg-amber-50 hover:border-amber-200 transition-colors">
            <p className="text-xs font-medium text-slate-700">{f.question}</p>
            {f.answer && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{f.answer}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIReplyPage() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leftTab, setLeftTab] = useState<"kb" | "faq">("faq");
  const [error, setError] = useState("");

  const generate = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setReply("");
    setError("");
    const res = await fetch("/api/ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, mode: "reply" }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setReply(data.reply || "");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full gap-0">
      {/* Left panel */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-slate-100 overflow-y-auto">
        <div className="flex border-b border-slate-100">
          {(["faq", "kb"] as const).map((tab) => (
            <button key={tab} onClick={() => setLeftTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${leftTab === tab ? "text-slate-800 border-b-2 border-slate-700" : "text-slate-400 hover:text-slate-600"}`}>
              {tab === "faq" ? "常見問題" : "知識庫"}
            </button>
          ))}
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          {leftTab === "faq"
            ? <FAQPanel onSelect={(q) => setQuestion(q)} />
            : <KnowledgeBasePanel />}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">AI 回覆助手</h1>
          <p className="text-xs text-slate-400 mt-0.5">輸入客戶問題，AI 根據知識庫生成建議回覆</p>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">客戶問題</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="貼上或輸入客戶的 LINE 訊息..."
              rows={4} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none" />
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-400">Ctrl+Enter 快速送出</p>
              <Button onClick={generate} disabled={loading || !question.trim()}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {loading ? "生成中..." : "生成回覆"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error === "ANTHROPIC_API_KEY 未設定"
              ? "AI 功能尚未啟用，請先到 Vercel 設定 ANTHROPIC_API_KEY 環境變數。"
              : error}
          </div>
        )}

        {(reply || loading) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">建議回覆</CardTitle>
                {reply && (
                  <button onClick={copy}
                    className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                    {copied ? "已複製 ✓" : "複製"}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex gap-1 items-center text-sm text-slate-400"><RefreshCw className="w-3.5 h-3.5 animate-spin" />生成中...</div>
                : <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{reply}</div>}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
