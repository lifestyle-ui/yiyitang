import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET → all VIP detection records, ordered by client then month
export async function GET() {
  const { data, error } = await supabase
    .from("VipDetection")
    .select("*")
    .order("clientName", { ascending: true })
    .order("monthNum", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST → create a record (used by seeding / manual add)
export async function POST(req: Request) {
  const b = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("VipDetection")
    .insert({
      id: crypto.randomUUID(),
      clientId: b.clientId || null,
      clientName: b.clientName,
      monthNum: b.monthNum,
      month: b.month,
      packageType: b.packageType,
      items: b.items || null,
      scheduledDate: b.scheduledDate || null,
      notes: b.notes || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
