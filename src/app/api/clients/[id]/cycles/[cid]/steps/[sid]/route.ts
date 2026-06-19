import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ sid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { sid } = await params;
  const { isCompleted } = await req.json();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("VisitCycleStep")
    .update({ isCompleted, completedAt: isCompleted ? now : null })
    .eq("id", sid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
