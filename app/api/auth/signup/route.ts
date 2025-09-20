import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string | undefined = body?.username?.trim();
  const password: string | undefined = body?.password;
  const displayName: string | undefined = body?.displayName || username;
  if (!username || !password) return NextResponse.json({ error: "username and password required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "username taken" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { username, displayName: displayName || username, passwordHash } });

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
}


