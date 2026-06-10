import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const now = new Date().toISOString();

  const { data: task, error } = await supabase
    .from("Task")
    .insert({
      id: crypto.randomUUID(),
      clientId: id,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      priority: data.priority || "medium",
      status: "pending",
      category: data.category || null,
      assignedTo: data.assignedTo || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(task, { status: 201 });
}
