import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const FIELDS = ["name", "category", "contactPerson", "contactTitle", "phone", "lineId", "email", "address", "cooperation", "bookingFlow", "notes"] as const;

export async function GET() {
  const { data, error } = await supabase
    .from("Vendor")
    .select("*")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "請填寫廠商名稱" }, { status: 400 });
  const now = new Date().toISOString();
  const row: Record<string, unknown> = { id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  for (const f of FIELDS) row[f] = b[f]?.trim?.() || b[f] || null;
  const { data, error } = await supabase.from("Vendor").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
