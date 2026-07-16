import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

const BUCKET = "questionnaires";

// List client's questionnaire files with signed URLs
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase.storage.from(BUCKET).list(id, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = await Promise.all(
    (data || []).filter((f) => f.name).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(`${id}/${f.name}`, 60 * 60); // 1 hour
      let displayName = f.name.replace(/^\d{13}_/, "");
      const m = displayName.match(/^([A-Za-z0-9_-]+)(\.[A-Za-z0-9]+)?$/);
      if (m) {
        try {
          const decoded = Buffer.from(m[1], "base64url").toString("utf8");
          if (decoded && !decoded.includes("�")) displayName = decoded;
        } catch { /* keep as-is */ }
      }
      return {
        name: f.name,
        displayName,
        size: f.metadata?.size ?? null,
        createdAt: f.created_at,
        url: signed?.signedUrl || null,
        isImage: /\.(png|jpe?g|gif|webp|heic)$/i.test(displayName),
      };
    })
  );
  return NextResponse.json(files);
}

// Upload one or more files (multipart form, field name "file")
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const formData = await req.formData();
  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "no file" }, { status: 400 });

  const failed: string[] = [];
  for (const file of files) {
    // Storage keys must be ASCII (percent-encoding gets decoded server-side,
    // so it can't be used): base64url-encode the original filename and decode
    // it in the list endpoint for display
    const ext = (file.name.match(/\.[A-Za-z0-9]+$/)?.[0] || "").toLowerCase();
    const encoded = Buffer.from(file.name, "utf8").toString("base64url");
    const safeName = `${Date.now()}_${encoded}${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${id}/${safeName}`, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "application/octet-stream",
      });
    if (error) failed.push(`${file.name}: ${error.message}`);
  }
  if (failed.length === files.length) {
    return NextResponse.json({ error: failed.join("\n") }, { status: 500 });
  }
  return NextResponse.json({ uploaded: files.length - failed.length, failed });
}

// Delete a file: /api/clients/[id]/files?name=xxx
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const name = new URL(req.url).searchParams.get("name");
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }
  const { error } = await supabase.storage.from(BUCKET).remove([`${id}/${name}`]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
