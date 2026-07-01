import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cycleType = searchParams.get("cycleType");
  if (!cycleType) return NextResponse.json({ error: "cycleType required" }, { status: 400 });

  const { data, error } = await supabase
    .from("CycleTypeStep")
    .select("*")
    .eq("cycleType", cycleType)
    .order("sortOrder", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { cycleType, label, sortOrder, role, deliverable, isKeyOutput, defaultOffset, hasDueTracking } = body;
  if (!cycleType || !label) return NextResponse.json({ error: "cycleType and label required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("CycleTypeStep")
    .select("sortOrder")
    .eq("cycleType", cycleType)
    .order("sortOrder", { ascending: false })
    .limit(1);

  const nextOrder = sortOrder ?? (existing && existing.length > 0 ? (existing[0].sortOrder as number) + 1 : 0);

  const { data, error } = await supabase
    .from("CycleTypeStep")
    .insert({
      cycleType,
      label,
      sortOrder: nextOrder,
      role: role ?? null,
      deliverable: deliverable ?? null,
      isKeyOutput: isKeyOutput ?? false,
      defaultOffset: defaultOffset ?? null,
      hasDueTracking: hasDueTracking ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
