import { IronSessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  username?: string;
};

const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET || "insecure-development-secret-change-me",
  cookieName: "tudu3_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}


