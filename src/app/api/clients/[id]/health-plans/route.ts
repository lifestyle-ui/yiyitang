import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("HealthPlan")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      title: data.title,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : now,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      goals: data.goals || null,
      status: data.status || "active",
      progress: data.progress || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row, { status: 201 });
}
