"use client";

import { HealthStatus } from "@repo/common/components/custom/health-status";
import { useHealthcheckQuery } from "@repo/common/queries/healthcheck.query";

export default function Home() {
  const { data, isPending, error } = useHealthcheckQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Hello Admin</h1>

      {isPending && (
        <p className="text-muted-foreground">Checking API health...</p>
      )}

      {error && (
        <p className="font-medium text-destructive">
          Error: could not reach the API
        </p>
      )}

      {data && <HealthStatus data={data} />}
    </main>
  );
}
