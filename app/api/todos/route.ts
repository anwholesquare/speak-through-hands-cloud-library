import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json([], { status: 200 });
  const todos = await prisma.todo.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const title: string | undefined = body?.title;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const count = await prisma.todo.count({ where: { userId: session.userId } });
  const todo = await prisma.todo.create({ data: { userId: session.userId, title, pile: Math.floor(count / 7) } });
  return NextResponse.json(todo);
}


