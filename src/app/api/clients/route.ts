import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const clients = await prisma.client.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { lineId: { contains: search } },
        ],
      }),
    },
    include: {
      _count: {
        select: {
          consultations: true,
          tasks: { where: { status: { not: "done" } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const data = await request.json();

  const client = await prisma.client.create({
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

  return NextResponse.json(client, { status: 201 });
}
