import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const tracking = await prisma.lineTracking.create({
    data: {
      clientId: id,
      date: data.date ? new Date(data.date) : new Date(),
      content: data.content,
      response: data.response || null,
      followUpNeeded: data.followUpNeeded || false,
    },
  });

  return NextResponse.json(tracking, { status: 201 });
}
