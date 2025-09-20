import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string | undefined = body?.username?.trim();
  const password: string | undefined = body?.password;
  if (!username || !password) return NextResponse.json({ error: "username and password required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.passwordHash) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
}


