import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { boss, SEND_EMAIL_QUEUE } from "../jobs/boss";

// Render up front so the job payload is plain JSON; the worker only delivers.
export async function queueEmail(
  to: string,
  subject: string,
  email: ReactElement,
) {
  const html = await render(email);
  const text = await render(email, { plainText: true });
  await boss.send(SEND_EMAIL_QUEUE, { to, subject, html, text });
}
