import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      consultations: { orderBy: { date: "desc" } },
      labTests: { orderBy: { createdAt: "desc" } },
      prescriptions: { orderBy: { date: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
      lineTrackings: { orderBy: { date: "desc" } },
      doctorNotes: { orderBy: { date: "desc" } },
      healthPlans: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params;
  const data = await _req.json();

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      gender: data.gender || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      phone: data.phone || null,
      email: data.email || null,
      lineId: data.lineId || null,
      address: data.address || null,
      occupation: data.occupation || null,
      referralSource: data.referralSource || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
