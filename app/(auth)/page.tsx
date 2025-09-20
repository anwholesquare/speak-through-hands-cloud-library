"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signup() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, displayName, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Signup failed");
      window.location.href = "/lists";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      window.location.href = "/lists";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>tudu3</CardTitle>
          <CardDescription>Sign up or log in with username & password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="display name (for signup)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button disabled={busy || !username || !password} onClick={login}>Login</Button>
            <Button variant="secondary" disabled={busy || !username || !password} onClick={signup}>Sign up</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


