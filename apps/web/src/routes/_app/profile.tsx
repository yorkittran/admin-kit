import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/profile")({
  component: () => <h1 className="font-bold text-2xl">Profile</h1>,
});
