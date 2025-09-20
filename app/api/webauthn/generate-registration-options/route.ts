import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const username: string | undefined = body?.username;
  const displayName: string | undefined = body?.displayName || username;
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const existingUser = await prisma.user.findUnique({ where: { username } });
  const user = existingUser ?? (await prisma.user.create({ data: { username, displayName: displayName || username } }));

  const authenticators = await prisma.authenticator.findMany({ where: { userId: user.id } });

  const options = await generateRegistrationOptions({
    rpName: "tudu3",
    rpID: req.nextUrl.hostname,
    // userID must be a BufferSource per @simplewebauthn >= v10
    userID: Buffer.from(user.id, "utf8"),
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials: authenticators.map((a) => ({ id: a.credentialID, type: "public-key" as const })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json(options);
}


