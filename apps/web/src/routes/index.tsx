import { createFileRoute } from "@tanstack/react-router";
import { ModeToggle } from "@/components/mode-toggle";

export const Route = createFileRoute("/")({
  component: () => (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-bold text-2xl">admin-kit</h1>
        <ModeToggle />
      </div>
    </main>
  ),
});
