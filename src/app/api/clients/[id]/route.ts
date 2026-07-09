import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const { data: client, error } = await supabase
    .from("Client")
    .select(`
      *,
      consultations:Consultation(*),
      labTests:LabTest(*),
      prescriptions:Prescription(*),
      tasks:Task(*),
      lineTrackings:LineTracking(*),
      doctorNotes:DoctorNote(*),
      healthPlans:HealthPlan(*)
    `)
    .eq("id", id)
    .eq("isActive", true)
    .single();

  if (error) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params;
  const data = await _req.json();

  const { data: client, error } = await supabase
    .from("Client")
    .update({
      // Only update fields that are present in the request, so partial
      // updates (e.g. toggling needsAttention) don't wipe other columns
      ...(data.name !== undefined && { name: data.name }),
      ...(data.medicalRecordNumber !== undefined && { medicalRecordNumber: data.medicalRecordNumber || null }),
      ...(data.gender !== undefined && { gender: data.gender || null }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.lineId !== undefined && { lineId: data.lineId || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.occupation !== undefined && { occupation: data.occupation || null }),
      ...(data.referralSource !== undefined && { referralSource: data.referralSource || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.riskLevel !== undefined && { riskLevel: data.riskLevel || null }),
      ...(data.needsAttention !== undefined && { needsAttention: !!data.needsAttention }),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const { error } = await supabase
    .from("Client")
    .update({ isActive: false, updatedAt: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
