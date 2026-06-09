import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const consultation = await prisma.consultation.create({
    data: {
      clientId: id,
      date: data.date ? new Date(data.date) : new Date(),
      chiefComplaint: data.chiefComplaint || null,
      content: data.content || null,
      doctorAdvice: data.doctorAdvice || null,
      nextSteps: data.nextSteps || null,
    },
  });

  return NextResponse.json(consultation, { status: 201 });
}
