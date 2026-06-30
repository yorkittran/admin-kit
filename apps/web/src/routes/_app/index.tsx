import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/chart";
import { productsCollection } from "@/features/products/collection";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const DAY_MS = 86_400_000;

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function localDayLabel(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function lastThirtyDays(createdDates: Date[]) {
  const today = startOfLocalDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  const days: { day: string; count: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({ day: localDayLabel(d), count: 0 });
  }
  for (const created of createdDates) {
    // round (not floor) absorbs DST hour-drift between local midnights
    const idx = Math.round(
      (startOfLocalDay(created).getTime() - start.getTime()) / DAY_MS,
    );
    const bucket = days[idx];
    if (bucket) bucket.count += 1;
  }
  return days;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          {label}
        </Text>
        <Text type="large" weight="bold">
          {value}
        </Text>
      </VStack>
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
    return <Text color="secondary">{m.common_loading()}</Text>;
  }

  return (
    <VStack gap={6}>
      <Heading level={1}>{m.dashboard_title()}</Heading>
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
          <VStack gap={3}>
            <Heading level={2}>{m.dashboard_created_30d()}</Heading>
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
          </VStack>
        </Card>
        <Card>
          <VStack gap={3}>
            <Heading level={2}>{m.dashboard_by_status()}</Heading>
            <ChartContainer config={barConfig} className="h-64 w-full">
              <BarChart data={barData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={4} />
              </BarChart>
            </ChartContainer>
          </VStack>
        </Card>
      </div>
    </VStack>
  );
}
