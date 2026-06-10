import { boss } from "./boss";
import { startSendEmailWorker } from "./send-email";

export async function startJobs() {
  await boss.start();
  await startSendEmailWorker();
}
