import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

const FIELDS = ["name", "category", "contactPerson", "contactTitle", "phone", "lineId", "email", "address", "cooperation", "bookingFlow", "notes"] as const;

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const b = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const f of FIELDS) if (b[f] !== undefined) patch[f] = b[f]?.trim?.() || b[f] || null;
  const { data, error } = await supabase.from("Vendor").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from("Vendor").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
