"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ConnectionConfig {
  id: string;
  alias_email: string;
  supabase_url: string;
  keepalive_endpoint_url: string;
  keepalive_method: string;
  enabled: boolean;
  interval_seconds: number;
  last_attempt_at: string | null;
  last_success_at: string | null;
  has_service_role: boolean;
  manual_ping_token: string | null;
  created_at: string;
}

interface ConfigTableProps {
  configs: ConnectionConfig[];
  renderedAt: number;
}

export function ConfigTable({ configs, renderedAt }: ConfigTableProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    setActionError(null);
    setLoading(id);
    try {
      const res = await fetch(`/api/configs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const deleteConfig = async () => {
    if (!deleteId) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/configs/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const runOnce = async (id: string) => {
    setActionError(null);
    setLoading(id);
    try {
      const config = configs.find((item) => item.id === id);

      if (!config?.manual_ping_token) {
        throw new Error("ERROR: MISSING MANUAL PING AUTHORIZATION");
      }

      const res = await fetch("/api/keepalive/run-once", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config_id: id,
          manual_ping_token: config.manual_ping_token,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const detailedError =
          typeof data.error === "string" && data.error
            ? data.error
            : typeof data.response_excerpt === "string" && data.response_excerpt
              ? data.response_excerpt
              : t("operationFailed");

        throw new Error(
          res.status === 401 && data.error === "Unauthorized"
            ? "ERROR: SESSION EXPIRED OR NOT AUTHENTICATED"
            : detailedError
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : t("operationFailed"));
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (config: ConnectionConfig) => {
    if (!config.enabled) {
      return <Badge variant="secondary">{t("offline")}</Badge>;
    }
    if (!config.last_success_at && !config.last_attempt_at) {
      return <Badge variant="outline">{t("noData")}</Badge>;
    }
    const intervalMs = config.interval_seconds * 1000;
    // Generous margin: 2x interval + 60s buffer for cron timing
    const marginMs = intervalMs * 2 + 60000;

    if (config.last_success_at) {
      const lastSuccess = new Date(config.last_success_at).getTime();
      if (now - lastSuccess < marginMs) {
        return <Badge variant="success">{t("activeStatus")}</Badge>;
      }
    }
    // Recent attempt but failing
    if (config.last_attempt_at) {
      const lastAttempt = new Date(config.last_attempt_at).getTime();
      if (now - lastAttempt < marginMs) {
        return <Badge variant="destructive">{t("stale")}</Badge>;
      }
    }
    return <Badge variant="destructive">{t("stale")}</Badge>;
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return t("never");
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}${t("sAgo")}`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t("mAgo")}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t("hAgo")}`;
    return `${Math.floor(seconds / 86400)}${t("dAgo")}`;
  };

  if (configs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-primary glow-text uppercase tracking-[2px]">
          {t("noConfigs")}
        </p>
        <p className="text-sm mt-2 text-muted-foreground uppercase tracking-wider">
          {t("noConfigsDesc")}
        </p>
        <Button variant="terminal" className="mt-4" onClick={() => router.push("/dashboard/new")}>
          {t("addConfig")}
        </Button>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-destructive animate-pulse">
          [!] {actionError}
        </p>
      )}

      <div className="space-y-3 md:hidden">
        {configs.map((config) => (
          <div key={config.id} className="space-y-3 border-2 border-border bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-mono text-sm text-primary">{config.alias_email}</p>
                  {config.has_service_role && (
                    <Badge variant="terminal" className="text-[10px]">
                      [SR]
                    </Badge>
                  )}
                </div>
                <p className="break-all font-mono text-[11px] text-muted-foreground">
                  {config.keepalive_endpoint_url}
                </p>
              </div>
              <div className="shrink-0">{getStatusBadge(config)}</div>
            </div>

            <div className="grid gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <p><span className="text-primary">{t("lastPing")}:</span> {formatRelativeTime(config.last_success_at)}</p>
              <p><span className="text-primary">{t("interval")}:</span> {config.interval_seconds}S</p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("enabled")}</span>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => toggleEnabled(config.id, checked)}
                  disabled={loading === config.id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runOnce(config.id)}
                disabled={loading === config.id}
                className="w-full text-xs"
              >
                {t("ping")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/dashboard/${config.id}`)}
                className="w-full text-xs"
              >
                {t("edit")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteId(config.id)}
                className="w-full text-xs xs:col-span-2"
              >
                {t("del")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("alias")}</TableHead>
            <TableHead>{t("endpoint")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("lastPing")}</TableHead>
            <TableHead>{t("interval")}</TableHead>
            <TableHead>{t("enabled")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.id} className="hover:bg-primary/5">
              <TableCell className="font-mono">
                {config.alias_email}
                {config.has_service_role && (
                  <Badge variant="terminal" className="ml-2 text-xs">
                    [SR]
                  </Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                {config.keepalive_endpoint_url}
              </TableCell>
              <TableCell>{getStatusBadge(config)}</TableCell>
              <TableCell className="font-mono text-xs">
                {formatRelativeTime(config.last_success_at)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {config.interval_seconds}S
              </TableCell>
              <TableCell>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    toggleEnabled(config.id, checked)
                  }
                  disabled={loading === config.id}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runOnce(config.id)}
                    disabled={loading === config.id}
                    title="Execute keep-alive now"
                    className="text-xs"
                  >
                    {t("ping")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/${config.id}`)}
                    className="text-xs"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteId(config.id)}
                    className="text-xs"
                  >
                    {t("del")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t("deleteConfig")}
        description={t("deleteWarning")}
      >
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="w-full sm:w-auto">
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={deleteConfig} className="w-full sm:w-auto">
            {t("confirmDelete")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
