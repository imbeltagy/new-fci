"use client";

import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { HealthcheckResponse } from "../../types/healthcheck";
import { formatUptime } from "../../utils/format";

const serviceBadge = (state: "up" | "down") => (
  <Badge variant={state === "up" ? "default" : "destructive"}>{state}</Badge>
);

export function HealthStatus({ data }: { data: HealthcheckResponse }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          API Healthcheck
          <Badge variant={data.status === "ok" ? "default" : "destructive"}>
            {data.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Last checked at {new Date(data.timestamp).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span>PostgreSQL</span>
          {serviceBadge(data.services.postgres)}
        </div>
        <div className="flex items-center justify-between">
          <span>Redis</span>
          {serviceBadge(data.services.redis)}
        </div>
        <div className="flex items-center justify-between">
          <span>Uptime</span>
          <span className="text-muted-foreground">
            {formatUptime(data.uptime)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
