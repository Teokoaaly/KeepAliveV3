"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMessage(t("checkEmail"));
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ERROR: UNKNOWN EXCEPTION");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="flex justify-end p-2">
        <LanguageSelector />
      </div>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{mode === "login" ? t("loginTitle") : t("registerTitle")}</CardTitle>
        <CardDescription>
          {mode === "login" ? t("loginDesc") : t("registerDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("password")}
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="font-mono"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive font-bold uppercase tracking-wider animate-pulse">
              [!] {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-primary font-bold uppercase tracking-wider glow-text">
              {message}
            </p>
          )}
          <Button type="submit" variant="terminal" className="w-full" disabled={loading}>
            {loading ? t("processing") : mode === "login" ? t("loginBtn") : t("registerBtn")}
          </Button>
        </form>
          <div className="mt-4 text-center text-xs uppercase tracking-wider sm:text-sm">
          {mode === "login" ? (
            <>
              {t("noAccount")}{" "}
              <button
                type="button"
                className="text-accent hover:underline glow-accent"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
              >
                [{t("register")}]
              </button>
            </>
          ) : (
            <>
              {t("haveAccount")}{" "}
              <button
                type="button"
                className="text-accent hover:underline glow-accent"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
              >
                [{t("login")}]
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
