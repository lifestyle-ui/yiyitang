"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";

// ─── PDF coordinate map (extracted from actual PDF, bottom-left origin) ──────
// page: 0-indexed; x,y in PDF points (1pt = 1/72 inch); page height = 841.9pt

const PDF_H = 841.9;

const CB: Record<string, { page: number; x: number; y: number }> = {
  // ── Page 1 (index 0) ─────────────────────────────────────────────────────
  // 代謝系統
  "1073": { page: 0, x: 34, y: 655 }, "1074": { page: 0, x: 34, y: 630 },
  "1280": { page: 0, x: 34, y: 606 }, "1285": { page: 0, x: 34, y: 582 },
  "1163": { page: 0, x: 34, y: 558 }, "1102": { page: 0, x: 34, y: 534 },
  "1281": { page: 0, x: 34, y: 510 },
  // 營養系統
  "1131": { page: 0, x: 34, y: 460 }, "0808": { page: 0, x: 34, y: 436 },
  "1436": { page: 0, x: 34, y: 412 }, "1455": { page: 0, x: 34, y: 388 },
  "0845": { page: 0, x: 34, y: 364 }, "1119": { page: 0, x: 34, y: 340 },
  "1120": { page: 0, x: 34, y: 316 }, "1452": { page: 0, x: 34, y: 292 },
  "1437": { page: 0, x: 34, y: 268 }, "1347": { page: 0, x: 34, y: 244 },
  "1348": { page: 0, x: 34, y: 220 },
  // 內分泌系統
  "0829": { page: 0, x: 307, y: 653 }, "1274": { page: 0, x: 307, y: 628 },
  "1278": { page: 0, x: 307, y: 604 }, "1170": { page: 0, x: 307, y: 580 },
  "1276": { page: 0, x: 307, y: 556 }, "1076": { page: 0, x: 307, y: 532 },
  "1067": { page: 0, x: 307, y: 508 }, "1068": { page: 0, x: 307, y: 484 },
  "1069": { page: 0, x: 307, y: 460 }, "1184": { page: 0, x: 307, y: 436 },
  "1066": { page: 0, x: 307, y: 412 },
  // 環境毒素
  "1055": { page: 0, x: 307, y: 364 }, "1357": { page: 0, x: 307, y: 340 },
  "1121": { page: 0, x: 307, y: 316 }, "0997": { page: 0, x: 307, y: 292 },
  "0999": { page: 0, x: 307, y: 268 },
  // ── Page 2 (index 1) ─────────────────────────────────────────────────────
  // 免疫系統
  "1187": { page: 1, x: 34, y: 653 }, "1402": { page: 1, x: 34, y: 629 },
  "1400": { page: 1, x: 34, y: 605 }, "1401": { page: 1, x: 34, y: 581 },
  "1403": { page: 1, x: 34, y: 557 }, "1247": { page: 1, x: 34, y: 533 },
  // 腸胃道系統
  "0885": { page: 1, x: 34, y: 484 }, "1075": { page: 1, x: 34, y: 460 },
  "0886": { page: 1, x: 34, y: 436 }, "1362": { page: 1, x: 34, y: 412 },
  "1361": { page: 1, x: 34, y: 388 }, "1245": { page: 1, x: 34, y: 364 },
  "1244": { page: 1, x: 34, y: 340 }, "1012": { page: 1, x: 34, y: 316 },
  "0872": { page: 1, x: 34, y: 292 },
  // 表觀遺傳時鐘
  "1295": { page: 1, x: 307, y: 653 }, "1296": { page: 1, x: 307, y: 629 },
  "1439": { page: 1, x: 307, y: 605 }, "1134": { page: 1, x: 307, y: 581 },
  "0520": { page: 1, x: 307, y: 557 }, "1133": { page: 1, x: 307, y: 533 },
  "0854": { page: 1, x: 307, y: 509 }, "0942": { page: 1, x: 307, y: 485 },
  "1195": { page: 1, x: 307, y: 461 }, "1196": { page: 1, x: 307, y: 437 },
  // ── Page 3 (index 2) ─────────────────────────────────────────────────────
  "351-1": { page: 2, x: 47, y: 666 }, "352-1": { page: 2, x: 47, y: 654 },
  "354-1": { page: 2, x: 47, y: 643 }, "318":   { page: 2, x: 47, y: 632 },
  "317":   { page: 2, x: 47, y: 621 }, "355-1": { page: 2, x: 47, y: 609 },
  "1266":  { page: 2, x: 47, y: 598 }, "308":   { page: 2, x: 47, y: 587 },
  "359":   { page: 2, x: 47, y: 575 }, "358":   { page: 2, x: 47, y: 564 },
  "363-1": { page: 2, x: 47, y: 553 },
  "1194":  { page: 2, x: 47, y: 515 },
  "1342":  { page: 2, x: 82, y: 526 }, "364-3": { page: 2, x: 171, y: 526 },
  "1343":  { page: 2, x: 82, y: 515 }, "586":   { page: 2, x: 171, y: 515 },
  "1344":  { page: 2, x: 82, y: 504 }, "1345":  { page: 2, x: 171, y: 504 },
  "1116":  { page: 2, x: 47, y: 456 },
  "364-2": { page: 2, x: 82, y: 477 }, "349-2": { page: 2, x: 172, y: 477 },
  "346-1": { page: 2, x: 82, y: 466 }, "583":   { page: 2, x: 172, y: 467 },
  "339":   { page: 2, x: 82, y: 455 }, "350-2": { page: 2, x: 172, y: 456 },
  "338":   { page: 2, x: 82, y: 445 }, "345-1": { page: 2, x: 172, y: 445 },
  "584":   { page: 2, x: 82, y: 435 }, "1337":  { page: 2, x: 172, y: 434 },
  "365-1": { page: 2, x: 47, y: 409 }, "1210":  { page: 2, x: 47, y: 398 },
  "1211":  { page: 2, x: 47, y: 386 }, "366-1": { page: 2, x: 47, y: 375 },
  "1212":  { page: 2, x: 47, y: 349 }, "1215":  { page: 2, x: 47, y: 338 },
  "199":   { page: 2, x: 47, y: 301 }, "197":   { page: 2, x: 47, y: 290 },
  "191":   { page: 2, x: 47, y: 278 }, "380-1": { page: 2, x: 47, y: 267 },
  "381":   { page: 2, x: 47, y: 256 }, "196-1": { page: 2, x: 47, y: 244 },
  "1249":  { page: 2, x: 47, y: 233 },
  "211":   { page: 2, x: 47, y: 206 }, "213":   { page: 2, x: 47, y: 194 },
  "413":   { page: 2, x: 47, y: 183 }, "212":   { page: 2, x: 47, y: 172 },
  "214":   { page: 2, x: 47, y: 160 },
  "181":   { page: 2, x: 47, y: 134 }, "150":   { page: 2, x: 47, y: 123 },
  "120":   { page: 2, x: 47, y: 112 }, "121":   { page: 2, x: 47, y: 100 },
  "122":   { page: 2, x: 47, y: 89  }, "1341":  { page: 2, x: 47, y: 77  },
  "106":   { page: 2, x: 312, y: 665 }, "100":  { page: 2, x: 312, y: 654 },
  "101":   { page: 2, x: 312, y: 643 }, "102":  { page: 2, x: 312, y: 631 },
  "103":   { page: 2, x: 312, y: 620 }, "104":  { page: 2, x: 312, y: 609 },
  "110":   { page: 2, x: 312, y: 597 }, "111":  { page: 2, x: 312, y: 586 },
  "1126":  { page: 2, x: 312, y: 501 },
  "127-3": { page: 2, x: 346, y: 536 }, "129-3": { page: 2, x: 433, y: 536 },
  "128-3": { page: 2, x: 346, y: 526 }, "130-3": { page: 2, x: 433, y: 526 },
  "151-3": { page: 2, x: 346, y: 515 }, "132-3": { page: 2, x: 433, y: 515 },
  "165-3": { page: 2, x: 346, y: 503 }, "123-3": { page: 2, x: 433, y: 503 },
  "154-3": { page: 2, x: 346, y: 493 }, "124-3": { page: 2, x: 433, y: 493 },
  "155-3": { page: 2, x: 346, y: 482 }, "133-3": { page: 2, x: 433, y: 482 },
  "134-3": { page: 2, x: 346, y: 470 },
  "123-5": { page: 2, x: 312, y: 438 }, "124-5": { page: 2, x: 312, y: 427 },
  "125-5": { page: 2, x: 312, y: 415 }, "128-5": { page: 2, x: 312, y: 404 },
  "129-5": { page: 2, x: 312, y: 392 }, "660":   { page: 2, x: 312, y: 381 },
  "1238":  { page: 2, x: 312, y: 369 },
  "1128":  { page: 2, x: 312, y: 309 },
  "1004-1":{ page: 2, x: 346, y: 339 }, "1004-2":{ page: 2, x: 434, y: 339 },
  "1004-3":{ page: 2, x: 346, y: 329 }, "1004-4":{ page: 2, x: 434, y: 329 },
  "1004-5":{ page: 2, x: 346, y: 319 }, "1005-1":{ page: 2, x: 434, y: 319 },
  "1005-2":{ page: 2, x: 346, y: 309 }, "1005-3":{ page: 2, x: 434, y: 309 },
  "1005-4":{ page: 2, x: 346, y: 299 }, "1006-1":{ page: 2, x: 434, y: 299 },
  "1006-2":{ page: 2, x: 346, y: 289 }, "1006-3":{ page: 2, x: 434, y: 289 },
  "1006-4":{ page: 2, x: 346, y: 279 }, "1006-5":{ page: 2, x: 434, y: 279 },
  "314":   { page: 2, x: 312, y: 244 }, "1201":  { page: 2, x: 312, y: 233 },
  "309":   { page: 2, x: 312, y: 221 }, "1202":  { page: 2, x: 312, y: 210 },
  "300":   { page: 2, x: 312, y: 198 }, "302":   { page: 2, x: 312, y: 187 },
  "303-2": { page: 2, x: 312, y: 175 }, "304":   { page: 2, x: 312, y: 164 },
  "306":   { page: 2, x: 312, y: 152 },
  // ── Page 4 (index 3) ─────────────────────────────────────────────────────
  "1115":  { page: 3, x: 48, y: 632 },
  "320-1": { page: 3, x: 83, y: 657 }, "326-1": { page: 3, x: 167, y: 657 },
  "323-1": { page: 3, x: 83, y: 647 }, "325-1": { page: 3, x: 167, y: 647 },
  "321-1": { page: 3, x: 83, y: 637 }, "324-1": { page: 3, x: 167, y: 637 },
  "333-1": { page: 3, x: 83, y: 627 }, "327-2": { page: 3, x: 167, y: 627 },
  "329-1": { page: 3, x: 83, y: 617 }, "328-1": { page: 3, x: 167, y: 617 },
  "1350":  { page: 3, x: 48, y: 568 }, "1130":  { page: 3, x: 48, y: 556 },
  "222":   { page: 3, x: 48, y: 545 },
  "1335":  { page: 3, x: 48, y: 506 }, "1336":  { page: 3, x: 48, y: 495 },
  "292":   { page: 3, x: 48, y: 472 }, "1213":  { page: 3, x: 48, y: 461 },
  "293":   { page: 3, x: 48, y: 450 },
  "1323":  { page: 3, x: 48, y: 401 }, "1334":  { page: 3, x: 48, y: 389 },
  "1214":  { page: 3, x: 48, y: 377 }, "1327":  { page: 3, x: 48, y: 365 },
  "1222":  { page: 3, x: 48, y: 341 },
  "243":   { page: 3, x: 48, y: 304 }, "231":   { page: 3, x: 48, y: 293 },
  "232":   { page: 3, x: 48, y: 281 }, "241":   { page: 3, x: 48, y: 270 },
  "233":   { page: 3, x: 48, y: 259 }, "234":   { page: 3, x: 48, y: 247 },
  "235":   { page: 3, x: 48, y: 236 }, "236":   { page: 3, x: 48, y: 225 },
  "237":   { page: 3, x: 48, y: 214 },
  "813":   { page: 3, x: 48, y: 177 }, "251":   { page: 3, x: 48, y: 165 },
  "252":   { page: 3, x: 48, y: 154 }, "260":   { page: 3, x: 48, y: 143 },
  "1106":  { page: 3, x: 310, y: 647 }, "1104": { page: 3, x: 310, y: 622 },
  "1209":  { page: 3, x: 310, y: 606 }, "382":  { page: 3, x: 310, y: 594 },
  "383":   { page: 3, x: 310, y: 583 }, "1333": { page: 3, x: 310, y: 572 },
  "385":   { page: 3, x: 310, y: 560 }, "386":  { page: 3, x: 310, y: 549 },
  "388":   { page: 3, x: 310, y: 538 }, "389":  { page: 3, x: 310, y: 527 },
  "390":   { page: 3, x: 310, y: 515 }, "391":  { page: 3, x: 310, y: 504 },
  "392":   { page: 3, x: 310, y: 493 }, "393":  { page: 3, x: 310, y: 481 },
  "394":   { page: 3, x: 310, y: 470 }, "1205": { page: 3, x: 310, y: 459 },
  "673":   { page: 3, x: 310, y: 420 }, "680":  { page: 3, x: 310, y: 409 },
  "674":   { page: 3, x: 310, y: 397 },
};

// Items that appear in multiple places get both positions
const CB_EXTRA: Array<{ code: string; page: number; x: number; y: number }> = [
  { code: "413",   page: 3, x: 48, y: 579 }, // Ca also in page 4 minerals
  { code: "365-1", page: 3, x: 48, y: 484 }, // hsCRP also in page 4
  { code: "1012",  page: 3, x: 48, y: 353 }, // H.Pylori also in page 4
];

// ─── Patient info header positions (PDF coords, pages 1&2 = indices 0&1) ─────
// Row 1: y≈757-758; Row 2: y≈731-733; Row 3: y≈706
const HEADER = {
  // Page 1&2 row 1
  sendUnitX: 95, sendUnitY: 757,
  nameX: 249, nameY: 757,
  dobYearX: 447, dobYearY: 757,
  dobMonthX: 493, dobMonthY: 757,
  dobDayX: 526, dobDayY: 757,
  // Page 1&2 row 2
  mrnX: 249, mrnY: 732,
  sampleYearX: 428, sampleYearY: 731,
  sampleMonthX: 460, sampleMonthY: 731,
  sampleDayX: 492, sampleDayY: 731,
  // Gender radio checkmarks (draw ✓ inside the □)
  genderMaleX: 318, genderFemaleX: 351, genderY: 733,
  // Report language ✓ inside □
  langTraditionalX: 87, langSimplifiedX: 122, langEnglishX: 157, langY: 731,
  // Page 3&4 row (slightly different coords) - simplified
  // y≈746 for row1, y≈720 for row2
};

type PatientInfo = {
  sendUnit: string; name: string; dob: string;
  mrn: string; gender: string; sampleDate: string; reportLang: string;
};

interface Props {
  checkedCodes: string[];
  info: PatientInfo;
  onClose: () => void;
}

export default function HanshiPdfFiller({ checkedCodes, info, onClose }: Props) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = await (pdfjsLib.getDocument as any)({ url: "/hanshi-template.pdf" }).promise;
        const SCALE = 2; // High quality (2× for retina)

        for (let pageNum = 1; pageNum <= 4; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: SCALE });
          const canvas = canvasRefs.current[pageNum - 1];
          if (!canvas) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // Store logical PDF size for coordinate mapping
          canvas.dataset.pdfW = String(viewport.width / SCALE);
          canvas.dataset.pdfH = String(viewport.height / SCALE);

          const ctx = canvas.getContext("2d")!;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render as any)({ canvas, canvasContext: ctx, viewport }).promise;

          if (cancelled) return;

          const pdfH = viewport.height / SCALE; // usually 841.9
          const pageIdx = pageNum - 1;

          // ── Draw checkmarks ─────────────────────────────────────────────
          ctx.save();
          ctx.fillStyle = "#000";
          ctx.font = `bold ${Math.round(11 * SCALE)}px Arial`;

          const drawCheck = (x: number, y: number) => {
            // ✓ inside the □ glyph (offset +2pt right, +1pt down)
            const cx = (x + 2) * SCALE;
            const cy = (pdfH - y + 1) * SCALE;
            ctx.fillText("✓", cx, cy);
          };

          for (const [code, pos] of Object.entries(CB)) {
            if (pos.page === pageIdx && checkedCodes.includes(code)) {
              drawCheck(pos.x, pos.y);
            }
          }
          for (const pos of CB_EXTRA) {
            if (pos.page === pageIdx && checkedCodes.includes(pos.code)) {
              drawCheck(pos.x, pos.y);
            }
          }

          // ── Draw patient info on pages 1&2 (index 0,1) ──────────────────
          if (pageIdx === 0 || pageIdx === 1) {
            ctx.font = `${Math.round(9.5 * SCALE)}px "Noto Serif TC", "Microsoft JhengHei", Arial`;
            ctx.fillStyle = "#000";

            const drawText = (text: string, pdfX: number, pdfY: number) => {
              if (!text) return;
              ctx.fillText(text, pdfX * SCALE, (pdfH - pdfY + 1.5) * SCALE);
            };

            // Row 1
            drawText(info.sendUnit, HEADER.sendUnitX, HEADER.sendUnitY);
            drawText(info.name, HEADER.nameX, HEADER.nameY);
            if (info.dob) {
              const [yr, mo, dy] = info.dob.split("-");
              drawText(yr || "", HEADER.dobYearX, HEADER.dobYearY);
              drawText(mo || "", HEADER.dobMonthX, HEADER.dobMonthY);
              drawText(dy || "", HEADER.dobDayX, HEADER.dobDayY);
            }

            // Row 2
            drawText(info.mrn, HEADER.mrnX, HEADER.mrnY);
            if (info.sampleDate) {
              const [yr, mo, dy] = info.sampleDate.split("-");
              drawText(yr || "", HEADER.sampleYearX, HEADER.sampleYearY);
              drawText(mo || "", HEADER.sampleMonthX, HEADER.sampleMonthY);
              drawText(dy || "", HEADER.sampleDayX, HEADER.sampleDayY);
            }

            // Gender ✓ (slightly smaller, inside □)
            ctx.font = `bold ${Math.round(9 * SCALE)}px Arial`;
            if (info.gender === "M" || info.gender === "male") {
              drawText("✓", HEADER.genderMaleX + 2, HEADER.genderY);
            } else if (info.gender === "F" || info.gender === "female") {
              drawText("✓", HEADER.genderFemaleX + 2, HEADER.genderY);
            }

            // Report language ✓
            if (info.reportLang === "繁體") drawText("✓", HEADER.langTraditionalX + 2, HEADER.langY);
            else if (info.reportLang === "簡體") drawText("✓", HEADER.langSimplifiedX + 2, HEADER.langY);
            else if (info.reportLang === "英文") drawText("✓", HEADER.langEnglishX + 2, HEADER.langY);
          }

          ctx.restore();
        }

        if (!cancelled) setStatus("ready");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    }

    render();
    return () => { cancelled = true; };
  }, [checkedCodes, info]);

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #hanshi-pdf-root { display: block !important; }
          .no-print { display: none !important; }
          .pdf-page { display: block; page-break-after: always; width: 100% !important; }
          .pdf-page canvas { width: 100% !important; height: auto !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-[60] bg-gray-100 overflow-y-auto" id="hanshi-pdf-root">
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 px-4 py-2" style={{ background: "#1a1209" }}>
          <button onClick={onClose} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
            <X className="w-4 h-4" /> 關閉
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: "#5c4638", color: "#fff" }}>
            <Printer className="w-4 h-4" />
            列印 / 儲存 PDF
          </button>
          <span className="text-white/40 text-xs ml-2">
            {status === "loading" && "PDF 載入中…"}
            {status === "ready" && `已勾選 ${checkedCodes.length} 項`}
            {status === "error" && "PDF 載入失敗"}
          </span>
        </div>

        {/* Loading indicator */}
        {status === "loading" && (
          <div className="flex items-center justify-center h-64 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 text-lg">正在渲染原始 PDF…</span>
          </div>
        )}

        {/* PDF pages */}
        <div className="flex flex-col items-center py-6 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="pdf-page shadow-2xl bg-white"
              style={{ maxWidth: "210mm", width: "100%" }}>
              <canvas
                ref={(el) => { canvasRefs.current[i] = el; }}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
