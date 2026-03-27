"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface KeepaliveLog {
  id: string;
  status_code: number | null;
  response_excerpt: string | null;
  attempted_at: string;
  duration_ms: number | null;
  error_message: string | null;
}

interface LogViewerProps {
  logs: KeepaliveLog[];
}

export function LogViewer({ logs }: LogViewerProps) {
  const { t } = useLanguage();

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-primary glow-text uppercase tracking-[2px]">
          {t("noLogs")}
        </p>
        <p className="text-sm mt-2 text-muted-foreground uppercase tracking-wider">
          {t("noLogsDesc")}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("timestamp")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("duration")}</TableHead>
          <TableHead>{t("error")}</TableHead>
          <TableHead>{t("response")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id} className="hover:bg-primary/5">
            <TableCell className="whitespace-nowrap font-mono text-xs">
              {new Date(log.attempted_at).toISOString()}
            </TableCell>
            <TableCell>
              {log.error_message ? (
                <Badge variant="destructive">[ERR]</Badge>
              ) : log.status_code && log.status_code < 400 ? (
                <Badge variant="success">[{log.status_code}]</Badge>
              ) : (
                <Badge variant="destructive">
                  [{log.status_code || "N/A"}]
                </Badge>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {log.duration_ms !== null ? `${log.duration_ms}MS` : "-"}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-destructive font-mono text-xs">
              {log.error_message || "-"}
            </TableCell>
            <TableCell className="max-w-[300px] truncate text-muted-foreground font-mono text-xs">
              {log.response_excerpt || "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
