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
      name: data.name,
      medicalRecordNumber: data.medicalRecordNumber || null,
      gender: data.gender || null,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      email: data.email || null,
      lineId: data.lineId || null,
      address: data.address || null,
      occupation: data.occupation || null,
      referralSource: data.referralSource || null,
      notes: data.notes || null,
      ...(data.riskLevel !== undefined && { riskLevel: data.riskLevel || null }),
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
