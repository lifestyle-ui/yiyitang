"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, Check, X, Edit2, AlertCircle, FileText, Image, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImportType = "product" | "testItem";

type ProductRow = {
  name: string; category?: string; brand?: string; spec?: string;
  dosage?: string; unit?: string; price?: string | number; notes?: string;
};
type TestItemRow = {
  name: string; category?: string; code?: string; description?: string;
  price?: string | number; turnaround?: string; notes?: string;
};
type DataRow = ProductRow | TestItemRow;

const PRODUCT_FIELDS = [
  { key: "name", label: "品名", required: true },
  { key: "category", label: "類別" },
  { key: "brand", label: "品牌" },
  { key: "spec", label: "規格" },
  { key: "dosage", label: "用法" },
  { key: "unit", label: "單位" },
  { key: "price", label: "售價" },
  { key: "notes", label: "備註" },
];

const TEST_FIELDS = [
  { key: "name", label: "項目名稱", required: true },
  { key: "category", label: "類別" },
  { key: "code", label: "代碼" },
  { key: "description", label: "說明" },
  { key: "price", label: "費用" },
  { key: "turnaround", label: "回報時間" },
  { key: "notes", label: "注意事項" },
];

interface SmartImportProps {
  type: ImportType;
  onImported: () => void;
  onClose: () => void;
}

export default function SmartImport({ type, onImported, onClose }: SmartImportProps) {
  const [step, setStep] = useState<"input" | "preview" | "saving">("input");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<DataRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const fields = type === "product" ? PRODUCT_FIELDS : TEST_FIELDS;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleExtract = async () => {
    if (!text.trim() && !file) { setError("請輸入文字或上傳檔案"); return; }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("type", type);
    if (file) formData.append("file", file);
    else formData.append("text", text);

    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "擷取失敗"); return; }
      if (!json.data || json.data.length === 0) { setError("沒有擷取到有效資料，請調整輸入內容"); return; }

      setRows(json.data);
      setSelected(new Set(json.data.map((_: unknown, i: number) => i)));
      setStep("preview");
    } catch {
      setError("發生錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const toSave = rows.filter((_, i) => selected.has(i));
    if (toSave.length === 0) return;

    setStep("saving");
    const endpoint = type === "product" ? "/api/products" : "/api/test-items";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    onImported();
    onClose();
  };

  const updateRow = (rowIdx: number, field: string, value: string) => {
    setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
  };

  const getFileIcon = (f: File) => {
    if (f.type.startsWith("image/")) return <Image className="w-5 h-5 text-purple-500" />;
    if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) return <Table className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">
              AI 智慧匯入 — {type === "product" ? "保健品" : "檢測項目"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "input" && (
            <div className="p-6 flex flex-col gap-5">
              {/* 說明 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: <FileText className="w-6 h-6 text-blue-500 mx-auto mb-1" />, label: "貼上文字", desc: "任何格式的文字清單" },
                  { icon: <Table className="w-6 h-6 text-green-500 mx-auto mb-1" />, label: "上傳 Excel/CSV", desc: "試算表檔案" },
                  { icon: <Image className="w-6 h-6 text-purple-500 mx-auto mb-1" />, label: "上傳圖片", desc: "產品目錄截圖" },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-slate-50 rounded-xl">
                    {item.icon}
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* 文字輸入 */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  貼上資料（支援任何格式）
                </label>
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setFile(null); }}
                  placeholder={type === "product"
                    ? "例：\n魚油 Nordic 1000mg EPA/DHA 每日2顆 飯後\n維生素D3 5000IU 每日1顆 早餐後\n益生菌 保時沛 每包含300億 睡前1包\n\n或直接貼上 Excel 表格內容也可以！"
                    : "例：\n血脂四項 LIPID 總膽固醇、三酸甘油酯等 500元 3天 空腹\n甲狀腺功能 T3 T4 TSH 800元 5天\n\n或直接貼上 Excel 表格內容也可以！"}
                  rows={8}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                />
              </div>

              {/* 拖曳上傳區 */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  或上傳檔案
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                    isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(file)}
                      <span className="text-sm font-medium text-slate-700">{file.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">拖曳或點擊上傳</p>
                      <p className="text-xs text-slate-400 mt-1">支援 Excel (.xlsx)、CSV、圖片 (.jpg/.png)</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file"
                  accept=".csv,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setText(""); } }} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    AI 擷取了 <span className="text-blue-600 font-bold">{rows.length}</span> 筆資料
                  </p>
                  <p className="text-xs text-slate-400">已選取 {selected.size} 筆，可直接編輯任何欄位</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(new Set(rows.map((_, i) => i)))}>全選</Button>
                  <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>取消全選</Button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="w-10 px-3 py-2.5">
                        <input type="checkbox"
                          checked={selected.size === rows.length}
                          onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                      </th>
                      {fields.map((f) => (
                        <th key={f.key} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <tr key={i} className={cn("transition-colors", selected.has(i) ? "bg-white" : "bg-slate-50 opacity-50")}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={selected.has(i)}
                            onChange={(e) => setSelected((prev) => {
                              const next = new Set(prev);
                              e.target.checked ? next.add(i) : next.delete(i);
                              return next;
                            })}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                        </td>
                        {fields.map((f) => (
                          <td key={f.key} className="px-3 py-1.5">
                            <input
                              value={(row as Record<string, unknown>)[f.key] as string || ""}
                              onChange={(e) => updateRow(i, f.key, e.target.value)}
                              className={cn(
                                "w-full min-w-[80px] px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-blue-500",
                                f.required && !(row as Record<string, unknown>)[f.key]
                                  ? "border-red-300 bg-red-50"
                                  : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                              )}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </div>
          )}

          {step === "saving" && (
            <div className="p-12 text-center">
              <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-600">儲存中...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          {step === "input" ? (
            <>
              <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">取消</button>
              <Button onClick={handleExtract} disabled={loading || (!text.trim() && !file)}>
                {loading ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />AI 分析中...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-1" />AI 智慧擷取</>
                )}
              </Button>
            </>
          ) : step === "preview" ? (
            <>
              <Button variant="secondary" onClick={() => setStep("input")}>← 返回修改</Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">即將儲存 {selected.size} 筆</span>
                <Button onClick={handleSave} disabled={selected.size === 0}>
                  <Check className="w-4 h-4 mr-1" />確認儲存
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
