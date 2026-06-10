import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-bold text-2xl">admin-kit</h1>
    </main>
  ),
});
