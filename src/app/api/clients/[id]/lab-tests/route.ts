import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();

  const { data: labTest, error } = await supabase
    .from("LabTest")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      testDate: data.testDate ? new Date(data.testDate).toISOString() : null,
      testType: data.testType,
      status: data.status || "scheduled",
      findings: data.findings || null,
      doctorInterpretation: data.doctorInterpretation || null,
      staffExplanation: data.staffExplanation || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(labTest, { status: 201 });
}
