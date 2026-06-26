"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", medicalRecordNumber: "", gender: "", birthDate: "", phone: "",
    email: "", lineId: "", address: "", occupation: "",
    referralSource: "", notes: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          medicalRecordNumber: data.medicalRecordNumber || "",
          gender: data.gender || "",
          birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
          phone: data.phone || "",
          email: data.email || "",
          lineId: data.lineId || "",
          address: data.address || "",
          occupation: data.occupation || "",
          referralSource: data.referralSource || "",
          notes: data.notes || "",
        });
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setFetching(false);
      });
  }, [id]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("姓名為必填"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/clients/${id}`);
        router.refresh();
      } else {
        setError(body.error || `儲存失敗（${res.status}）`);
      }
    } catch (err) {
      setError(`網路錯誤：${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`確定要刪除「${form.name}」的所有資料嗎？此操作無法還原。`)) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    window.location.href = "/clients";
  };

  if (fetching) return <div className="p-6 text-slate-400 text-sm">載入中...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${id}`} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">編輯客戶資料</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle>基本資料</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="姓名 *" placeholder="請輸入客戶姓名" value={form.name} onChange={set("name")} required />
              <Input label="病歷號碼" placeholder="例：MR-2024-001" value={form.medicalRecordNumber} onChange={set("medicalRecordNumber")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="性別" value={form.gender} onChange={set("gender")}
                options={[{ value: "男", label: "男" }, { value: "女", label: "女" }, { value: "其他", label: "其他" }]}
                placeholder="請選擇" />
              <Input label="生日" type="date" value={form.birthDate} onChange={set("birthDate")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="電話" placeholder="0912-345-678" value={form.phone} onChange={set("phone")} />
              <Input label="LINE ID" placeholder="line_id" value={form.lineId} onChange={set("lineId")} />
            </div>
            <Input label="Email" type="email" placeholder="example@email.com" value={form.email} onChange={set("email")} />
            <Input label="地址" placeholder="請輸入地址" value={form.address} onChange={set("address")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>其他資訊</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input label="職業" placeholder="請輸入職業" value={form.occupation} onChange={set("occupation")} />
            <Input label="轉介來源" placeholder="例：朋友介紹、網路" value={form.referralSource} onChange={set("referralSource")} />
            <Textarea label="備註" placeholder="其他備註事項..." value={form.notes} onChange={set("notes")} rows={3} />

            {/* 標籤管理 */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#6b6056" }}>標籤</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-sm"
                    style={{ background: "#ece2d6", color: "#5c4638", border: "1px solid #C4D4CC" }}>
                    {tag}
                    <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="transition-opacity hover:opacity-60">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = tagInput.trim();
                      if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                      setTagInput("");
                    }
                  }}
                  placeholder="輸入標籤名稱，按 Enter 新增..."
                  className="flex-1 px-3 py-1.5 text-sm rounded-sm focus:outline-none"
                  style={{ border: "1px solid #d8cfc3" }}
                />
                <button type="button"
                  onClick={() => {
                    const t = tagInput.trim();
                    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                    setTagInput("");
                    tagInputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-sm rounded-sm border transition-colors"
                  style={{ borderColor: "#5c4638", color: "#5c4638" }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#b3a99d" }}>例：自律神經、荷爾蒙、減重、長照…</p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        <div className="flex justify-between items-center">
          <button type="button" onClick={handleDelete}
            className="text-sm px-3 py-1.5 rounded-sm border transition-colors"
            style={{ borderColor: "#E8BABA", color: "#B83232" }}>
            刪除此客戶
          </button>
          <div className="flex gap-3">
            <Link href={`/clients/${id}`}>
              <Button type="button" variant="secondary">取消</Button>
            </Link>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              <Save className="w-4 h-4" />
              {loading ? "儲存中..." : "儲存變更"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
