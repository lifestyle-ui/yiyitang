import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let query = supabase
    .from("Client")
    .select("*, consultations:Consultation(count), tasks:Task(count)")
    .eq("isActive", true)
    .order("updatedAt", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,lineId.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const data = await request.json();
  const now = new Date().toISOString();

  const { data: client, error } = await supabase
    .from("Client")
    .insert({
      id: crypto.randomUUID(),
      name: data.name,
      gender: data.gender || null,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      email: data.email || null,
      lineId: data.lineId || null,
      address: data.address || null,
      occupation: data.occupation || null,
      referralSource: data.referralSource || null,
      notes: data.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(client, { status: 201 });
}
