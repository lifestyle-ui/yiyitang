import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();

  const { data: prescription, error } = await supabase
    .from("Prescription")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      date: data.date ? new Date(data.date).toISOString() : now,
      items: JSON.stringify(data.items || []),
      totalDays: data.totalDays ? parseInt(data.totalDays) : null,
      runOutDate: data.runOutDate ? new Date(data.runOutDate).toISOString() : null,
      status: data.status || "active",
      notes: data.notes || null,
      lifestyle: data.lifestyle || null,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(prescription, { status: 201 });
}
