import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: { title?: string; completed?: boolean } = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.completed === "boolean") data.completed = body.completed;
  if (!("title" in data) && !("completed" in data)) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  // Ensure ownership before update
  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.todo.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const deleted = await prisma.todo.delete({ where: { id } });
  if (deleted.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}


