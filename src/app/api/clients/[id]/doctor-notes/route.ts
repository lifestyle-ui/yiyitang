import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const note = await prisma.doctorNote.create({
    data: {
      clientId: id,
      date: data.date ? new Date(data.date) : new Date(),
      diagnosis: data.diagnosis || null,
      treatment: data.treatment || null,
      prescription: data.prescription || null,
      notes: data.notes || null,
      nextVisit: data.nextVisit ? new Date(data.nextVisit) : null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
