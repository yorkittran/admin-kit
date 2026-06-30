import { useToast as useAstryxToast } from "@astryxdesign/core/Toast";
import type { ReactNode } from "react";

/** Sonner-shaped toast helper built on Astryx useToast.
 *
 * Usage (inside any React component):
 *   const toast = useToast();
 *   toast.success("Done!");
 *   toast.error("Something went wrong.");
 */
export function useToast() {
  const show = useAstryxToast();
  return {
    success: (body: ReactNode) => show({ body }),
    error: (body: ReactNode) => show({ body, type: "error" }),
  };
}
