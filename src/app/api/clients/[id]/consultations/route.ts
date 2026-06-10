import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();

  const { data: consultation, error } = await supabase
    .from("Consultation")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      date: data.date ? new Date(data.date).toISOString() : now,
      chiefComplaint: data.chiefComplaint || null,
      content: data.content || null,
      doctorAdvice: data.doctorAdvice || null,
      nextSteps: data.nextSteps || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(consultation, { status: 201 });
}
