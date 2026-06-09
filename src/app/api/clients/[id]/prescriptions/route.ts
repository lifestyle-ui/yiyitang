import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const prescription = await prisma.prescription.create({
    data: {
      clientId: id,
      date: data.date ? new Date(data.date) : new Date(),
      items: JSON.stringify(data.items || []),
      totalDays: data.totalDays ? parseInt(data.totalDays) : null,
      runOutDate: data.runOutDate ? new Date(data.runOutDate) : null,
      status: data.status || "active",
      notes: data.notes || null,
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}
