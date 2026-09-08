import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("Quote")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const b = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("Quote")
    .insert({
      id: crypto.randomUUID(),
      orderNo: b.orderNo || null,
      orderDate: b.orderDate || null,
      orderType: b.orderType || "一般訂單",
      clientId: b.clientId || null,
      clientName: b.clientName || null,
      items: typeof b.items === "string" ? b.items : JSON.stringify(b.items || []),
      shipping: b.shipping ? parseInt(b.shipping) : 0,
      exchangeRate: b.exchangeRate ? Number(b.exchangeRate) : 1,
      notes: b.notes || null,
      total: b.total ? parseInt(b.total) : 0,
      prescriptionId: b.prescriptionId || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
