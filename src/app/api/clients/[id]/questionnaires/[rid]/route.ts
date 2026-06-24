import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("HealthQuestionnaire")
    .update({
      ...(body.date !== undefined && { date: new Date(body.date).toISOString() }),
      ...(body.chiefComplaint !== undefined && { chiefComplaint: body.chiefComplaint || null }),
      ...(body.healthGoals !== undefined && { healthGoals: body.healthGoals || null }),
      ...(body.symptoms !== undefined && { symptoms: body.symptoms || null }),
      ...(body.sleep !== undefined && { sleep: body.sleep ?? null }),
      ...(body.energy !== undefined && { energy: body.energy ?? null }),
      ...(body.digestion !== undefined && { digestion: body.digestion ?? null }),
      ...(body.mood !== undefined && { mood: body.mood ?? null }),
      ...(body.pain !== undefined && { pain: body.pain ?? null }),
      ...(body.sleepNotes !== undefined && { sleepNotes: body.sleepNotes || null }),
      ...(body.energyNotes !== undefined && { energyNotes: body.energyNotes || null }),
      ...(body.digestionNotes !== undefined && { digestionNotes: body.digestionNotes || null }),
      ...(body.moodNotes !== undefined && { moodNotes: body.moodNotes || null }),
      ...(body.painNotes !== undefined && { painNotes: body.painNotes || null }),
      ...(body.diet !== undefined && { diet: body.diet || null }),
      ...(body.exercise !== undefined && { exercise: body.exercise || null }),
      ...(body.stress !== undefined && { stress: body.stress || null }),
      ...(body.currentMeds !== undefined && { currentMeds: body.currentMeds || null }),
      ...(body.medicalHistory !== undefined && { medicalHistory: body.medicalHistory || null }),
      ...(body.allergies !== undefined && { allergies: body.allergies || null }),
      ...(body.expectations !== undefined && { expectations: body.expectations || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      updatedAt: now,
    })
    .eq("id", rid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("HealthQuestionnaire").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
