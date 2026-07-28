"use client";

import { useEffect, useState } from "react";
import { CODE_INFO } from "@/components/HanshiOrderForm";

// Logical form size (PDF points; images are the real form rendered at 3×)
const PAGE_W = 595;
const PAGE_H = 842;

type Box = { code: string; x: number; y: number };
type PageBoxes = { w: number; h: number; boxes: Box[] };
type HeaderPos = { x: number; y: number };
type PageHeader = Partial<Record<"trad" | "simp" | "eng" | "male" | "female" | "meno" | "supp", HeaderPos>>;

// Patient-info text fields per page (top-left px on 595×842), from the form builder
const FIELDS: { id: string; x: number; y: number; w: number }[][] = [
  [{ id: "unit", x: 92, y: 84.7, w: 100 }, { id: "name", x: 246, y: 83.8, w: 122 }, { id: "birthY", x: 449, y: 83.8, w: 28 }, { id: "birthM", x: 491, y: 83.8, w: 20 }, { id: "birthD", x: 524, y: 83.8, w: 18 }, { id: "chart", x: 247, y: 109.3, w: 48 }, { id: "collY", x: 430, y: 110.7, w: 24 }, { id: "collM", x: 468, y: 110.7, w: 15 }, { id: "collD", x: 498, y: 110.7, w: 15 }, { id: "collH", x: 528, y: 110.7, w: 15 }, { id: "lmpDays", x: 267, y: 136.1, w: 30 }, { id: "lmp", x: 408, y: 136.1, w: 42 }, { id: "menoAge", x: 511, y: 136.1, w: 26 }],
  [{ id: "unit", x: 92, y: 84.7, w: 100 }, { id: "name", x: 246, y: 83.8, w: 122 }, { id: "birthY", x: 449, y: 83.8, w: 28 }, { id: "birthM", x: 491, y: 83.8, w: 20 }, { id: "birthD", x: 524, y: 83.8, w: 18 }, { id: "chart", x: 247, y: 109.3, w: 48 }, { id: "collY", x: 430, y: 110.7, w: 24 }, { id: "collM", x: 468, y: 110.7, w: 15 }, { id: "collD", x: 498, y: 110.7, w: 15 }, { id: "collH", x: 528, y: 110.7, w: 15 }, { id: "lmpDays", x: 267, y: 136.1, w: 30 }, { id: "lmp", x: 408, y: 136.1, w: 42 }, { id: "menoAge", x: 511, y: 136.1, w: 26 }],
  [{ id: "unit", x: 95.6, y: 70.6, w: 100 }, { id: "name", x: 249.6, y: 69.7, w: 122 }, { id: "birthY", x: 452.6, y: 69.7, w: 28 }, { id: "birthM", x: 494.6, y: 69.7, w: 20 }, { id: "birthD", x: 527.6, y: 69.7, w: 18 }, { id: "chart", x: 250.6, y: 95.2, w: 48 }, { id: "collY", x: 433.6, y: 96.6, w: 24 }, { id: "collM", x: 471.6, y: 96.6, w: 15 }, { id: "collD", x: 501.6, y: 96.6, w: 15 }, { id: "collH", x: 531.6, y: 96.6, w: 15 }, { id: "lmpDays", x: 270.6, y: 122, w: 30 }, { id: "lmp", x: 411.6, y: 122, w: 42 }, { id: "menoAge", x: 514.6, y: 122, w: 26 }],
  [{ id: "unit", x: 95.6, y: 70.6, w: 100 }, { id: "name", x: 249.6, y: 69.7, w: 122 }, { id: "birthY", x: 452.6, y: 69.7, w: 28 }, { id: "birthM", x: 494.6, y: 69.7, w: 20 }, { id: "birthD", x: 527.6, y: 69.7, w: 18 }, { id: "chart", x: 250.6, y: 95.2, w: 48 }, { id: "collY", x: 433.6, y: 96.6, w: 24 }, { id: "collM", x: 471.6, y: 96.6, w: 15 }, { id: "collD", x: 501.6, y: 96.6, w: 15 }, { id: "collH", x: 531.6, y: 96.6, w: 15 }, { id: "lmpDays", x: 270.6, y: 122, w: 30 }, { id: "lmp", x: 411.6, y: 122, w: 42 }, { id: "menoAge", x: 514.6, y: 122, w: 26 }],
];

export type HanshiInfo = {
  sendUnit: string; name: string; dob: string; mrn: string; gender: "" | "M" | "F";
  sampleDate: string; sampleTime: string; reportLang: "繁體" | "簡體" | "英文" | "";
  menstrualCycle: string; lmp: string; menopauseAge: string;
};

type Client = { id: string; name: string; medicalRecordNumber?: string | null; dateOfBirth?: string | null; gender?: string | null };
type SavedData = { items: { code: string }[]; info: Partial<HanshiInfo> };

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export default function HanshiFormV2({ client, onClose, onRefresh, initialData, existingId }: {
  client: Client; onClose: () => void; onRefresh?: () => void; initialData?: SavedData; existingId?: string;
}) {
  const [pagesBoxes, setPagesBoxes] = useState<PageBoxes[] | null>(null);
  const [headers, setHeaders] = useState<Record<string, PageHeader> | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    initialData ? Object.fromEntries(initialData.items.map((i) => [i.code, true])) : {});
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState<HanshiInfo>(() => ({
    sendUnit: initialData?.info?.sendUnit ?? "意一堂健康管理",
    name: initialData?.info?.name ?? client.name,
    dob: initialData?.info?.dob ?? (client.dateOfBirth ? client.dateOfBirth.slice(0, 10) : ""),
    mrn: initialData?.info?.mrn ?? client.medicalRecordNumber ?? "",
    gender: initialData?.info?.gender ?? (client.gender === "male" ? "M" : client.gender === "female" ? "F" : ""),
    sampleDate: initialData?.info?.sampleDate ?? new Date().toISOString().slice(0, 10),
    sampleTime: initialData?.info?.sampleTime ?? "",
    reportLang: initialData?.info?.reportLang ?? "繁體",
    menstrualCycle: initialData?.info?.menstrualCycle ?? "",
    lmp: initialData?.info?.lmp ?? "",
    menopauseAge: initialData?.info?.menopauseAge ?? "",
  }));

  useEffect(() => {
    Promise.all([
      fetch("/hanshi-boxes.json").then((r) => r.json()),
      fetch("/hanshi-header.json").then((r) => r.json()),
    ]).then(([b, h]) => { setPagesBoxes(b); setHeaders(h); }).catch(() => {});
  }, []);

  const toggle = (code: string) => setChecked((p) => ({ ...p, [code]: !p[code] }));
  const selectedCount = Object.values(checked).filter(Boolean).length;

  const save = async () => {
    const codes = Object.entries(checked).filter(([, v]) => v).map(([c]) => c);
    if (codes.length === 0) { alert("請先勾選檢測項目"); return; }
    setSaving(true);
    const payload = {
      testDate: info.sampleDate,
      testType: "瀚仕功能醫學檢測申請單",
      status: "scheduled",
      findings: JSON.stringify({ items: codes.map((c) => ({ code: c, name: CODE_INFO[c]?.name || c })), info }),
    };
    try {
      if (existingId) await fetch(`/api/clients/${client.id}/lab-tests/${existingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      else await fetch(`/api/clients/${client.id}/lab-tests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      onRefresh?.();
      onClose();
    } finally { setSaving(false); }
  };

  // Field value getter mapping form field ids → info
  const fieldVal = (id: string): string => {
    const [y, m, d] = (info.dob || "").split("-");
    const [sy, sm, sd] = (info.sampleDate || "").split("-");
    switch (id) {
      case "unit": return info.sendUnit;
      case "name": return info.name;
      case "birthY": return y || ""; case "birthM": return m || ""; case "birthD": return d || "";
      case "chart": return info.mrn;
      case "collY": return sy || ""; case "collM": return sm || ""; case "collD": return sd || ""; case "collH": return info.sampleTime;
      case "lmpDays": return info.menstrualCycle; case "lmp": return info.lmp; case "menoAge": return info.menopauseAge;
      default: return "";
    }
  };
  const setField = (id: string, v: string) => setInfo((p) => {
    const parts = (k: string) => (p[k as keyof HanshiInfo] as string || "").split("-");
    switch (id) {
      case "unit": return { ...p, sendUnit: v };
      case "name": return { ...p, name: v };
      case "birthY": { const [, m, d] = parts("dob"); return { ...p, dob: `${v}-${m || ""}-${d || ""}` }; }
      case "birthM": { const [y, , d] = parts("dob"); return { ...p, dob: `${y || ""}-${v}-${d || ""}` }; }
      case "birthD": { const [y, m] = parts("dob"); return { ...p, dob: `${y || ""}-${m || ""}-${v}` }; }
      case "chart": return { ...p, mrn: v };
      case "collY": { const [, m, d] = parts("sampleDate"); return { ...p, sampleDate: `${v}-${m || ""}-${d || ""}` }; }
      case "collM": { const [y, , d] = parts("sampleDate"); return { ...p, sampleDate: `${y || ""}-${v}-${d || ""}` }; }
      case "collD": { const [y, m] = parts("sampleDate"); return { ...p, sampleDate: `${y || ""}-${m || ""}-${v}` }; }
      case "collH": return { ...p, sampleTime: v };
      case "lmpDays": return { ...p, menstrualCycle: v };
      case "lmp": return { ...p, lmp: v };
      case "menoAge": return { ...p, menopauseAge: v };
      default: return p;
    }
  });

  const ready = pagesBoxes && headers;

  const renderPage = (i: number, forPrint: boolean) => {
    const pb = pagesBoxes![i];
    const hdr = headers![`p${i + 1}`] || {};
    const fields = FIELDS[i] || [];
    const width = forPrint ? "190mm" : `${PAGE_W * scale}px`;
    return (
      <div key={i} className="hanshi-page" style={{ position: "relative", width, containerType: "inline-size", background: "#fff", boxShadow: forPrint ? "none" : "0 4px 24px rgba(0,0,0,.3)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/hanshi-page${i + 1}.png`} alt={`第${i + 1}頁`} style={{ display: "block", width: "100%", height: "auto" }} />

        {/* Item checkboxes */}
        {pb.boxes.map((b) => (
          <div key={b.code} onClick={forPrint ? undefined : () => toggle(b.code)}
            title={`${b.code} ${CODE_INFO[b.code]?.name || ""}`}
            style={{ position: "absolute", left: pct(b.x - 2.5, PAGE_W), top: pct(b.y - 2.5, PAGE_H), width: "2.6cqw", height: "2.6cqw", cursor: forPrint ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "2.2cqw", lineHeight: 1, borderRadius: 2, background: !forPrint && checked[b.code] ? "rgba(37,99,235,.10)" : "transparent" }}>
            {checked[b.code] ? "✓" : ""}
          </div>
        ))}

        {/* Header checkboxes */}
        {(["male", "female"] as const).map((g) => hdr[g] && (
          <HdrCheck key={g} pos={hdr[g]!} on={info.gender === (g === "male" ? "M" : "F")}
            onClick={forPrint ? undefined : () => setInfo((p) => ({ ...p, gender: g === "male" ? "M" : "F" }))} forPrint={forPrint} />
        ))}
        {([["trad", "繁體"], ["simp", "簡體"], ["eng", "英文"]] as const).map(([k, lang]) => hdr[k] && (
          <HdrCheck key={k} pos={hdr[k]!} on={info.reportLang === lang}
            onClick={forPrint ? undefined : () => setInfo((p) => ({ ...p, reportLang: lang }))} forPrint={forPrint} />
        ))}

        {/* Patient info text fields */}
        {fields.map((f) => (
          <input key={f.id} value={fieldVal(f.id)} readOnly={forPrint}
            onChange={(e) => setField(f.id, e.target.value)}
            style={{ position: "absolute", left: pct(f.x, PAGE_W), top: pct(f.y - 9, PAGE_H), width: pct(f.w, PAGE_W), height: "2.4cqw", border: forPrint ? "none" : "1px solid rgba(37,99,235,.25)", borderRadius: 2, background: forPrint ? "transparent" : "rgba(37,99,235,.04)", fontSize: "1.9cqw", lineHeight: 1, padding: "0 1px", color: "#111", outline: "none", fontFamily: "'Noto Serif TC', sans-serif" }} />
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#hanshi-v2-print) { display: none !important; }
          #hanshi-v2-print { display: block !important; }
          #hanshi-v2-print .hanshi-page { page-break-after: always; box-shadow: none !important; }
          @page { size: A4; margin: 8mm; }
        }
        #hanshi-v2-print { display: none; }
      `}</style>

      {/* Print-only: all pages */}
      <div id="hanshi-v2-print">{ready && [0, 1, 2, 3].map((i) => renderPage(i, true))}</div>

      {/* Interactive UI */}
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#5a5e63" }}>
        <header className="flex items-center gap-3 px-4" style={{ flex: "none", height: 52, background: "#1f2226", color: "#eef0f2" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>瀚仕功能醫學檢測申請單</div>
          <div style={{ fontSize: 11, color: "#9aa0a6" }}>點框即可勾選</div>
          <div style={{ flex: 1 }} />
          <div className="flex gap-1" style={{ background: "#2b2f34", padding: 3, borderRadius: 7 }}>
            {["第 1 頁", "第 2 頁", "第 3 頁", "第 4 頁"].map((label, n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ height: 28, padding: "0 12px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600, background: n === page ? "#eef0f2" : "transparent", color: n === page ? "#1f2226" : "#aeb4ba" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div className="flex items-center gap-1.5">
            <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))} style={zbtn}>−</button>
            <div style={{ width: 44, textAlign: "center", fontSize: 12, color: "#cfd3d7" }}>{Math.round(scale * 100)}%</div>
            <button onClick={() => setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))} style={zbtn}>+</button>
          </div>
          <div style={{ width: 1, height: 24, background: "#3a3e43" }} />
          <span style={{ fontSize: 12, color: "#cfd3d7" }}>已選 <b style={{ color: "#fff", fontSize: 14 }}>{selectedCount}</b> 項</span>
          <button onClick={() => setChecked({})} style={ghostBtn}>清除</button>
          <button onClick={() => window.print()} style={ghostBtn}>列印 / PDF</button>
          <button onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中…" : "儲存"}</button>
          <button onClick={onClose} style={ghostBtn}>關閉</button>
        </header>

        <main style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 24, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          {!ready ? <div style={{ color: "#eef0f2", marginTop: 40 }}>載入表單中…</div> : renderPage(page, false)}
        </main>
      </div>
    </>
  );
}

function HdrCheck({ pos, on, onClick, forPrint }: { pos: HeaderPos; on: boolean; onClick?: () => void; forPrint: boolean }) {
  return (
    <div onClick={onClick}
      style={{ position: "absolute", left: pct(pos.x - 2.5, PAGE_W), top: pct(pos.y - 2.5, PAGE_H), width: "2.6cqw", height: "2.6cqw", cursor: forPrint ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 700, fontSize: "2.2cqw", lineHeight: 1 }}>
      {on ? "✓" : ""}
    </div>
  );
}

const zbtn: React.CSSProperties = { width: 28, height: 28, border: "none", borderRadius: 5, background: "#2b2f34", color: "#eef0f2", fontSize: 16, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { height: 30, padding: "0 12px", border: "1px solid #44494f", borderRadius: 6, background: "transparent", color: "#cfd3d7", fontSize: 12, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { height: 30, padding: "0 16px", border: "none", borderRadius: 6, background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" };
