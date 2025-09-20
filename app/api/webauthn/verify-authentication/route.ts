import { NextRequest, NextResponse } from "next/server";
import { VerifyAuthenticationResponseOpts, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { expectedChallenge, response, userId } = body || {};
  if (!response || !expectedChallenge || !userId) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const authenticator = await prisma.authenticator.findFirst({
    where: { userId, credentialID: Buffer.from(response.rawId, "base64url") },
  });
  if (!authenticator) return NextResponse.json({ error: "credential not found" }, { status: 404 });

  const rpID = req.nextUrl.hostname;
  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const verifyOpts: VerifyAuthenticationResponseOpts = {
    expectedChallenge,
    expectedOrigin: [origin],
    expectedRPID: rpID,
    response,
    authenticator: {
      credentialID: Buffer.from(authenticator.credentialID),
      credentialPublicKey: Buffer.from(authenticator.credentialPublicKey),
      counter: authenticator.counter,
      transports: (authenticator.transports as any) ?? [],
    },
  };

  const verification = await verifyAuthenticationResponse(verifyOpts);
  if (!verification.verified) return NextResponse.json({ verified: false }, { status: 400 });

  await prisma.authenticator.update({
    where: { id: authenticator.id },
    data: { counter: verification.authenticationInfo?.newCounter ?? authenticator.counter },
  });

  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ verified: true });
}


