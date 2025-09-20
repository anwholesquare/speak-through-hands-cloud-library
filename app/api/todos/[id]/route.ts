import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const completed: boolean | undefined = body?.completed;
  if (typeof completed !== "boolean") return NextResponse.json({ error: "completed required" }, { status: 400 });
  const updated = await prisma.todo.update({ where: { id: params.id }, data: { completed } });
  if (updated.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const deleted = await prisma.todo.delete({ where: { id: params.id } });
  if (deleted.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}


