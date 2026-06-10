import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("LineTracking")
    .update({
      date: data.date ? new Date(data.date).toISOString() : undefined,
      content: data.content,
      response: data.response || null,
      followUpNeeded: !!data.followUpNeeded,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", rid)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("LineTracking").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
