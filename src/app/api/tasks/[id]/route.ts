import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (data.status !== undefined) updates.status = data.status;
  if (data.title !== undefined) updates.title = data.title;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.dueDate !== undefined) updates.dueDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
  if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;

  const { data: task, error } = await supabase
    .from("Task")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from("Task").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
