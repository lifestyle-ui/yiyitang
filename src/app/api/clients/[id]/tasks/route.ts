import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const task = await prisma.task.create({
    data: {
      clientId: id,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || "medium",
      category: data.category || null,
      assignedTo: data.assignedTo || null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
