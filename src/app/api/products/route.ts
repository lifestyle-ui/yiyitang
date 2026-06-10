import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("Product")
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

  // 支援批量匯入（array）或單筆新增（object）
  if (Array.isArray(data)) {
    const rows = data.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category || null,
      brand: item.brand || null,
      spec: item.spec || null,
      dosage: item.dosage || null,
      unit: item.unit || "顆",
      description: item.description || null,
      price: item.price ? parseInt(item.price) : null,
      notes: item.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    const { data: products, error } = await supabase.from("Product").insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(products, { status: 201 });
  }

  const { data: product, error } = await supabase
    .from("Product")
    .insert({
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category || null,
      brand: data.brand || null,
      spec: data.spec || null,
      dosage: data.dosage || null,
      unit: data.unit || "顆",
      description: data.description || null,
      price: data.price ? parseInt(data.price) : null,
      notes: data.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(product, { status: 201 });
}
