import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("TestItem")
    .select("*")
    .eq("isActive", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const data = await request.json();
  const now = new Date().toISOString();

  if (Array.isArray(data)) {
    const rows = data.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category || null,
      code: item.code || null,
      description: item.description || null,
      price: item.price ? parseInt(item.price) : null,
      turnaround: item.turnaround || null,
      notes: item.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    const { data: items, error } = await supabase.from("TestItem").insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(items, { status: 201 });
  }

  const { data: item, error } = await supabase
    .from("TestItem")
    .insert({
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category || null,
      code: data.code || null,
      description: data.description || null,
      price: data.price ? parseInt(data.price) : null,
      turnaround: data.turnaround || null,
      notes: data.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(item, { status: 201 });
}
