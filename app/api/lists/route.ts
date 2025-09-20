import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json([], { status: 200 });
  const lists = await prisma.list.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title: string | undefined = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const count = await prisma.list.count({ where: { userId: session.userId } });
  const list = await prisma.list.create({ data: { userId: session.userId, title, posX: count * 2.0, posZ: 0 } });
  return NextResponse.json(list);
}


