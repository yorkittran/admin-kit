import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ModeToggle } from "@/components/mode-toggle";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-2xl">admin-kit</h1>
      <p className="text-muted-foreground">
        API: {isError ? "unreachable" : (data?.status ?? "connecting…")}
      </p>
      <ModeToggle />
    </main>
  );
}
