import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Dashboard</h1>
      <p className="text-muted-foreground">
        API: {isError ? "unreachable" : (data?.status ?? "connecting…")}
      </p>
    </div>
  );
}
