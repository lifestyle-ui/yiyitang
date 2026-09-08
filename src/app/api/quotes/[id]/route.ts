import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase.from("Quote").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const b = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (b.orderNo !== undefined) patch.orderNo = b.orderNo || null;
  if (b.orderDate !== undefined) patch.orderDate = b.orderDate || null;
  if (b.orderType !== undefined) patch.orderType = b.orderType || "一般訂單";
  if (b.clientName !== undefined) patch.clientName = b.clientName || null;
  if (b.clientId !== undefined) patch.clientId = b.clientId || null;
  if (b.items !== undefined) patch.items = typeof b.items === "string" ? b.items : JSON.stringify(b.items || []);
  if (b.shipping !== undefined) patch.shipping = b.shipping ? parseInt(b.shipping) : 0;
  if (b.exchangeRate !== undefined) patch.exchangeRate = b.exchangeRate ? Number(b.exchangeRate) : 1;
  if (b.notes !== undefined) patch.notes = b.notes || null;
  if (b.total !== undefined) patch.total = b.total ? parseInt(b.total) : 0;
  const { data, error } = await supabase.from("Quote").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from("Quote").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
