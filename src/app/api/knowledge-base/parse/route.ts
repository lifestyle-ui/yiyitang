import { NextResponse } from "next/server";
import JSZip from "jszip";

// Extract plain text from an uploaded .docx (paragraph per line)
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少檔案" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    return NextResponse.json({ error: "無法解析 Word 檔案" }, { status: 400 });
  }

  const paragraphs = [...docXml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) =>
    [...p[0].matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)]
      .map((t) => t[1])
      .join("")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  );

  const text = paragraphs.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return NextResponse.json({ text });
}
