"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ConfigFormData {
  alias_email: string;
  supabase_url: string;
  anon_key: string;
  service_role_key: string;
  keepalive_endpoint_url: string;
  keepalive_method: "GET" | "POST";
  keepalive_headers: string;
  keepalive_body: string;
  interval_seconds: number;
}

interface ConfigFormProps {
  initialData?: Partial<ConfigFormData>;
  configId?: string;
}

export function ConfigForm({ initialData, configId }: ConfigFormProps) {
  const isEditing = !!configId;
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ConfigFormData>({
    alias_email: initialData?.alias_email || "",
    supabase_url: initialData?.supabase_url || "",
    anon_key: initialData?.anon_key || "",
    service_role_key: "",
    keepalive_endpoint_url: initialData?.keepalive_endpoint_url || "",
    keepalive_method: initialData?.keepalive_method || "GET",
    keepalive_headers: initialData?.keepalive_headers || "{}",
    keepalive_body: initialData?.keepalive_body || "",
    interval_seconds: initialData?.interval_seconds || 300,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showServiceRole, setShowServiceRole] = useState(false);

  const userEditedEndpoint = useRef(!!initialData?.keepalive_endpoint_url);
  const userEditedHeaders = useRef(!!initialData?.keepalive_headers);

  // Auto-fill endpoint from Supabase URL (only for new configs)
  useEffect(() => {
    if (!isEditing && !userEditedEndpoint.current && formData.supabase_url && formData.supabase_url.includes("supabase.co")) {
      const baseUrl = formData.supabase_url.replace(/\/$/, "")
      setFormData(prev => ({ ...prev, keepalive_endpoint_url: `${baseUrl}/rest/v1/` }))
    }
  }, [formData.supabase_url, isEditing])

  // Auto-fill headers from anon key (only for new configs)
  useEffect(() => {
    if (!isEditing && !userEditedHeaders.current && formData.anon_key && formData.anon_key.startsWith("eyJ")) {
      const autoHeaders = JSON.stringify(
        { apikey: formData.anon_key, Authorization: `Bearer ${formData.anon_key}` },
        null,
        2
      )
      setFormData(prev => ({ ...prev, keepalive_headers: autoHeaders }))
    }
  }, [formData.anon_key, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.keepalive_headers) {
        try {
          JSON.parse(formData.keepalive_headers);
        } catch {
          throw new Error(t("invalidJsonHeaders"));
        }
      }
      if (formData.keepalive_body && formData.keepalive_method === "POST") {
        try {
          JSON.parse(formData.keepalive_body);
        } catch {
          throw new Error(t("invalidJsonBody"));
        }
      }

      const payload: Record<string, unknown> = {
        alias_email: formData.alias_email,
        supabase_url: formData.supabase_url,
        anon_key: formData.anon_key,
        keepalive_endpoint_url: formData.keepalive_endpoint_url,
        keepalive_method: formData.keepalive_method,
        keepalive_headers: formData.keepalive_headers
          ? JSON.parse(formData.keepalive_headers)
          : {},
        keepalive_body:
          formData.keepalive_body && formData.keepalive_method === "POST"
            ? JSON.parse(formData.keepalive_body)
            : null,
        interval_seconds: formData.interval_seconds,
      };

      if (formData.service_role_key) {
        payload.service_role_key = formData.service_role_key;
      }

      const url = isEditing
        ? `/api/configs/${configId}`
        : "/api/configs";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("operationFailed"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ERROR: UNKNOWN EXCEPTION");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ConfigFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? t("modifyConfig") : t("newConfig")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="alias" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("aliasEmailLabel")}
            </label>
            <Input
              id="alias"
              type="text"
              placeholder="my-project@example.com"
              value={formData.alias_email}
              onChange={(e) => updateField("alias_email", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="supabase_url" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("supabaseUrl")}
            </label>
            <Input
              id="supabase_url"
              type="url"
              placeholder="https://your-project.supabase.co"
              value={formData.supabase_url}
              onChange={(e) => updateField("supabase_url", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="anon_key" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("anonKey")}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                {t("publicNotSecret")}
              </span>
            </label>
            <Input
              id="anon_key"
              type="text"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={formData.anon_key}
              onChange={(e) => updateField("anon_key", e.target.value)}
              required
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="service_role" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("serviceRoleKey")}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                {t("optionalEncrypted")}
              </span>
            </label>
            <div className="relative">
              <Input
                id="service_role"
                type={showServiceRole ? "text" : "password"}
                placeholder={
                  isEditing
                    ? t("keepEmpty")
                    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                }
                value={formData.service_role_key}
                onChange={(e) => updateField("service_role_key", e.target.value)}
                className="font-mono text-xs"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary uppercase tracking-wider hover:text-accent"
                onClick={() => setShowServiceRole(!showServiceRole)}
              >
                [{showServiceRole ? t("hide") : t("show")}]
              </button>
            </div>
          </div>

          <div className="border-t-2 border-border pt-4">
            <p className="text-sm font-bold uppercase tracking-[2px] text-primary mb-4 glow-text">
              {t("keepaliveConfig")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="endpoint" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("endpointUrl")}
            </label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://your-project.supabase.co/rest/v1/"
              value={formData.keepalive_endpoint_url}
              onChange={(e) => {
                userEditedEndpoint.current = true
                updateField("keepalive_endpoint_url", e.target.value)
              }}
              required
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="method" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("httpMethod")}
            </label>
            <select
              id="method"
              className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono uppercase tracking-wider focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
              value={formData.keepalive_method}
              onChange={(e) =>
                updateField("keepalive_method", e.target.value as "GET" | "POST")
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="headers" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("customHeaders")}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                {t("jsonOptional")}
              </span>
            </label>
            <textarea
              id="headers"
              className="flex min-h-[80px] w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono text-xs focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
              placeholder='{"apikey": "...", "Authorization": "Bearer ..."}'
              value={formData.keepalive_headers}
              onChange={(e) => {
                userEditedHeaders.current = true
                updateField("keepalive_headers", e.target.value)
              }}
            />
          </div>

          {formData.keepalive_method === "POST" && (
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-bold uppercase tracking-wider text-primary">
                {t("requestBody")}{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  {t("jsonOptional")}
                </span>
              </label>
              <textarea
                id="body"
                className="flex min-h-[80px] w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono text-xs focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
                placeholder='{"key": "value"}'
                value={formData.keepalive_body}
                onChange={(e) => updateField("keepalive_body", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="interval" className="text-sm font-bold uppercase tracking-wider text-primary">
              {t("intervalSeconds")}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                {t("minDefault")}
              </span>
            </label>
            <Input
              id="interval"
              type="number"
              min={60}
              value={formData.interval_seconds}
              onChange={(e) =>
                updateField("interval_seconds", parseInt(e.target.value) || 300)
              }
              className="font-mono"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-bold uppercase tracking-wider animate-pulse">
              [!] {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="terminal" disabled={loading}>
              {loading
                ? t("processing")
                : isEditing
                ? t("update")
                : t("create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
