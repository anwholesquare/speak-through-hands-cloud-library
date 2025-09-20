import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  session.destroy();
  const url = new URL("/auth", req.url);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  session.destroy();
  const url = new URL("/auth", req.url);
  return NextResponse.redirect(url);
}


