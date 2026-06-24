import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ rid: string }> };

export async function DELETE(_: NextRequest, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("HealthTimelineEvent").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
