import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ cid: string }> };

// Body: { stepIds: string[] } — ordered list of step IDs, will be assigned sortOrder 0,1,2...
export async function POST(req: Request, { params }: Params) {
  const { cid } = await params;
  const { stepIds } = await req.json();
  if (!Array.isArray(stepIds)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const updates = stepIds.map((id: string, i: number) =>
    supabase.from("VisitCycleStep").update({ sortOrder: i }).eq("id", id).eq("cycleId", cid)
  );
  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
