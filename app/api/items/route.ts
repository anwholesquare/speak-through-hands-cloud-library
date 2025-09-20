import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// Query items by listId
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json([], { status: 200 });
  const listId = req.nextUrl.searchParams.get("listId");
  if (!listId) return NextResponse.json([], { status: 200 });
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== session.userId) return NextResponse.json([], { status: 200 });
  const items = await prisma.item.findMany({ where: { listId }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title: string | undefined = body?.title?.trim();
  const listId: string | undefined = body?.listId;
  if (!title || !listId) return NextResponse.json({ error: "title and listId required" }, { status: 400 });
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const maxOrder = await prisma.item.aggregate({ _max: { sortOrder: true }, where: { listId } });
  const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;
  const item = await prisma.item.create({ data: { listId, title, sortOrder: nextOrder } });
  return NextResponse.json(item);
}


