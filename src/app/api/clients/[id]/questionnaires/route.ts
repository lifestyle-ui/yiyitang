import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("HealthQuestionnaire")
    .select("*")
    .eq("clientId", id)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("HealthQuestionnaire")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      date: body.date ? new Date(body.date).toISOString() : now,
      chiefComplaint: body.chiefComplaint || null,
      healthGoals: body.healthGoals || null,
      symptoms: body.symptoms || null,
      sleep: body.sleep ?? null,
      energy: body.energy ?? null,
      digestion: body.digestion ?? null,
      mood: body.mood ?? null,
      pain: body.pain ?? null,
      sleepNotes: body.sleepNotes || null,
      energyNotes: body.energyNotes || null,
      digestionNotes: body.digestionNotes || null,
      moodNotes: body.moodNotes || null,
      painNotes: body.painNotes || null,
      diet: body.diet || null,
      exercise: body.exercise || null,
      stress: body.stress || null,
      currentMeds: body.currentMeds || null,
      medicalHistory: body.medicalHistory || null,
      allergies: body.allergies || null,
      expectations: body.expectations || null,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
