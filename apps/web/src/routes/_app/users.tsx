import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/users")({
  component: () => <h1 className="font-bold text-2xl">Users</h1>,
});
