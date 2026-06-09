"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthDate: "",
    phone: "",
    email: "",
    lineId: "",
    address: "",
    occupation: "",
    referralSource: "",
    notes: "",
  });

  const set = (field: string) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const client = await res.json();
      router.push(`/clients/${client.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">新增客戶</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>基本資料</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="姓名 *"
              placeholder="請輸入客戶姓名"
              value={form.name}
              onChange={set("name")}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="性別"
                value={form.gender}
                onChange={set("gender")}
                options={[
                  { value: "男", label: "男" },
                  { value: "女", label: "女" },
                  { value: "其他", label: "其他" },
                ]}
                placeholder="請選擇"
              />
              <Input
                label="生日"
                type="date"
                value={form.birthDate}
                onChange={set("birthDate")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="電話"
                placeholder="0912-345-678"
                value={form.phone}
                onChange={set("phone")}
              />
              <Input
                label="LINE ID"
                placeholder="line_id"
                value={form.lineId}
                onChange={set("lineId")}
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={set("email")}
            />
            <Input
              label="地址"
              placeholder="請輸入地址"
              value={form.address}
              onChange={set("address")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>其他資訊</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="職業"
              placeholder="請輸入職業"
              value={form.occupation}
              onChange={set("occupation")}
            />
            <Input
              label="轉介來源"
              placeholder="例：朋友介紹、網路"
              value={form.referralSource}
              onChange={set("referralSource")}
            />
            <Textarea
              label="備註"
              placeholder="其他備註事項..."
              value={form.notes}
              onChange={set("notes")}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/clients">
            <Button type="button" variant="secondary">
              取消
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !form.name.trim()}>
            <Save className="w-4 h-4" />
            {loading ? "儲存中..." : "儲存客戶"}
          </Button>
        </div>
      </form>
    </div>
  );
}
