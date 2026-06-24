import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("LabTest")
    .update({
      ...(data.testDate !== undefined && { testDate: data.testDate ? new Date(data.testDate).toISOString() : null }),
      ...(data.testType !== undefined && { testType: data.testType }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.findings !== undefined && { findings: data.findings || null }),
      ...(data.doctorInterpretation !== undefined && { doctorInterpretation: data.doctorInterpretation || null }),
      ...(data.staffExplanation !== undefined && { staffExplanation: data.staffExplanation || null }),
      ...(data.reportUrl !== undefined && { reportUrl: data.reportUrl || null }),
      ...(data.price !== undefined && { price: data.price ? Number(data.price) : null }),
      ...(data.sampleCollectedAt !== undefined && { sampleCollectedAt: data.sampleCollectedAt ? new Date(data.sampleCollectedAt).toISOString() : null }),
      ...(data.reportReceivedAt !== undefined && { reportReceivedAt: data.reportReceivedAt ? new Date(data.reportReceivedAt).toISOString() : null }),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", rid)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("LabTest").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
