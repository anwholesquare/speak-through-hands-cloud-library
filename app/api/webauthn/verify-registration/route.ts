import { NextRequest, NextResponse } from "next/server";
import { VerifyRegistrationResponseOpts, verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { expectedChallenge, response } = body || {};
  if (!response || !expectedChallenge) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const rpID = req.nextUrl.hostname;
  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const verifyOpts: VerifyRegistrationResponseOpts = {
    expectedChallenge,
    expectedOrigin: [origin],
    expectedRPID: rpID,
    response,
  };

  const verification = await verifyRegistrationResponse(verifyOpts);
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;

  const userId: string | undefined = body?.userId;
  if (!userId) return NextResponse.json({ error: "missing user" }, { status: 400 });

  await prisma.authenticator.create({
    data: {
      userId,
      credentialID: Buffer.from(credentialID),
      credentialPublicKey: Buffer.from(credentialPublicKey),
      counter,
      credentialDeviceType,
      credentialBackedUp,
      aaguid: aaguid ?? undefined,
    },
  });

  return NextResponse.json({ verified: true });
}


