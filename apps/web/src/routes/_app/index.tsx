import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { productsCollection } from "@/features/products/collection";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const DAY_MS = 86_400_000;

function lastThirtyDays(createdDates: Date[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    days.push({ day: d.toISOString().slice(5, 10), count: 0 });
  }
  const start = today.getTime() - 29 * DAY_MS;
  for (const created of createdDates) {
    const idx = Math.floor((created.getTime() - start) / DAY_MS);
    const bucket = days[idx];
    if (bucket) bucket.count += 1;
  }
  return days;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-bold text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: products, isLoading } = useLiveQuery((q) =>
    q.from({ p: productsCollection }),
  );

  const active = products.filter((p) => p.status === "active").length;
  const archived = products.length - active;

  const lineData = lastThirtyDays(products.map((p) => new Date(p.createdAt)));
  const barData = [
    {
      status: m.products_status_active(),
      count: active,
      fill: "var(--color-active)",
    },
    {
      status: m.products_status_archived(),
      count: archived,
      fill: "var(--color-archived)",
    },
  ];

  const lineConfig = {
    count: { label: m.dashboard_created_30d(), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const barConfig = {
    count: { label: m.dashboard_by_status() },
    active: { label: m.products_status_active(), color: "var(--chart-2)" },
    archived: { label: m.products_status_archived(), color: "var(--chart-4)" },
  } satisfies ChartConfig;

  if (isLoading) {
    return <p className="text-muted-foreground">{m.common_loading()}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">{m.dashboard_title()}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={m.dashboard_total_products()}
          value={products.length}
        />
        <StatCard label={m.dashboard_active_products()} value={active} />
        <StatCard label={m.dashboard_archived_products()} value={archived} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {m.dashboard_created_30d()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-64 w-full">
              <LineChart data={lineData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="count"
                  type="monotone"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {m.dashboard_by_status()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-64 w-full">
              <BarChart data={barData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
