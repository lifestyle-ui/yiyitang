import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status } : { status: { not: "done" } }),
      ...(searchParams.get("today") === "true" && {
        dueDate: { lte: today },
      }),
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(tasks);
}
