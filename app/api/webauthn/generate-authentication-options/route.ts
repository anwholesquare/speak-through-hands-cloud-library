import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username: string | undefined = body?.username;
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const authenticators = await prisma.authenticator.findMany({ where: { userId: user.id } });
  const options = await generateAuthenticationOptions({
    rpID: req.nextUrl.hostname,
    allowCredentials: authenticators.map((a) => ({ id: a.credentialID, type: "public-key" as const })),
    userVerification: "preferred",
  });

  return NextResponse.json({ ...options, userId: user.id });
}


