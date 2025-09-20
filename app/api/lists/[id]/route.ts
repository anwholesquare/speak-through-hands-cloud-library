import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; posX?: number; posZ?: number } = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.posX === "number") data.posX = body.posX;
  if (typeof body?.posZ === "number") data.posZ = body.posZ;
  const existing = await prisma.list.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const updated = await prisma.list.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const existing = await prisma.list.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await prisma.list.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


