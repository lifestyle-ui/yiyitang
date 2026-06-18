import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let query = supabase.from("OptionConfig").select("*").order("sortOrder").order("createdAt");
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const data = await request.json();
  const { data: option, error } = await supabase
    .from("OptionConfig")
    .insert({ id: crypto.randomUUID(), category: data.category, label: data.label, sortOrder: data.sortOrder ?? 0 })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(option, { status: 201 });
}
