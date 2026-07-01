import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: templateId } = await params;
  const body = await req.json();

  // Get max orderIndex for this template
  const { data: existing } = await supabase
    .from("PlanTemplateTask")
    .select("orderIndex")
    .eq("templateId", templateId)
    .order("orderIndex", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].orderIndex as number) + 1 : 0;

  const { data, error } = await supabase
    .from("PlanTemplateTask")
    .insert({
      templateId,
      phase: body.phase,
      name: body.name,
      durationHours: body.durationHours ?? 1,
      orderIndex: body.orderIndex ?? nextOrder,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
