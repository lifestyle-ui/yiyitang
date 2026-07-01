import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("PlanTemplate")
    .select("*, tasks:PlanTemplateTask(*)");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Sort tasks by orderIndex
  const sorted = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    tasks: Array.isArray(t.tasks)
      ? [...(t.tasks as Record<string, unknown>[])].sort((a, b) => (a.orderIndex as number) - (b.orderIndex as number))
      : [],
  }));
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("PlanTemplate")
    .insert({ name: body.name, description: body.description ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
