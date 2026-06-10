import { transport } from "../email/transport";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { boss, SEND_EMAIL_QUEUE, type SendEmailJob } from "./boss";

export async function startSendEmailWorker() {
  await boss.createQueue(SEND_EMAIL_QUEUE);
  await boss.work<SendEmailJob>(SEND_EMAIL_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const { to, subject, html, text } = job.data;
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
      });
      logger.info({ to, subject }, "email sent");
    }
  });
}
