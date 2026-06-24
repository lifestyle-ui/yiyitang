import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data } = await supabase.from("FunctionalMatrix").select("*").eq("clientId", id).single();
  return NextResponse.json(data ?? null);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("FunctionalMatrix")
    .upsert({ ...body, clientId: id, updatedAt: now }, { onConflict: "clientId" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
