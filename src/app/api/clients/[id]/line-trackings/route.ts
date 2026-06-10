import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();

  const { data: tracking, error } = await supabase
    .from("LineTracking")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      date: data.date ? new Date(data.date).toISOString() : now,
      content: data.content,
      response: data.response || null,
      followUpNeeded: data.followUpNeeded || false,
      createdAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(tracking, { status: 201 });
}
