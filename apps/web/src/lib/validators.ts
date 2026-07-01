import { m } from "@/paraglide/messages";

export const validateEmail = ({ value }: { value: string }) =>
  value.includes("@") ? undefined : m.common_email_invalid();
