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
      testItemId: data.testItemId || null,
      status: data.status || "suggested",
      findings: data.findings || null,
      doctorInterpretation: data.doctorInterpretation || null,
      staffExplanation: data.staffExplanation || null,
      reportUrl: data.reportUrl || null,
      price: data.price ? Number(data.price) : null,
      sampleCollectedAt: data.sampleCollectedAt ? new Date(data.sampleCollectedAt).toISOString() : null,
      reportReceivedAt: data.reportReceivedAt ? new Date(data.reportReceivedAt).toISOString() : null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(labTest, { status: 201 });
}
