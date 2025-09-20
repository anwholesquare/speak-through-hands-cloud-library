"use client";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signup() {
    setBusy(true); setError(null);
    try {
      const regOpts = await fetch("/api/webauthn/generate-registration-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName }),
      }).then((r) => r.json());

      const attResp = await startRegistration(regOpts);

      const verify = await fetch("/api/webauthn/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedChallenge: regOpts.challenge, response: attResp, userId: regOpts.user?.id ?? regOpts.userId ?? undefined }),
      }).then((r) => r.json());

      if (!verify.verified) throw new Error("Registration failed");
      window.location.href = "/";
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    setBusy(true); setError(null);
    try {
      const authOpts = await fetch("/api/webauthn/generate-authentication-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      }).then((r) => r.json());

      const assertion = await startAuthentication(authOpts);

      const verify = await fetch("/api/webauthn/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedChallenge: authOpts.challenge, response: assertion, userId: authOpts.userId }),
      }).then((r) => r.json());

      if (!verify.verified) throw new Error("Login failed");
      window.location.href = "/";
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>tudu3</CardTitle>
          <CardDescription>Sign up or log in with your face (Passkey)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="display name (for signup)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button disabled={busy || !username} onClick={login}>Login with Face</Button>
            <Button variant="secondary" disabled={busy || !username} onClick={signup}>Sign up with Face</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


