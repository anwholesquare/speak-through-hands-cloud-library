import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; completed?: boolean; sortOrder?: number } = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.completed === "boolean") data.completed = body.completed;
  if (typeof body?.sortOrder === "number") data.sortOrder = body.sortOrder;
  const existing = await prisma.item.findUnique({ where: { id: params.id }, include: { list: true } });
  if (!existing || existing.list.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const updated = await prisma.item.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const existing = await prisma.item.findUnique({ where: { id: params.id }, include: { list: true } });
  if (!existing || existing.list.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await prisma.item.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


