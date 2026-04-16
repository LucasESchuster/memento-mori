import { prisma } from "../lib/db";
import { sendWeeklyEmail } from "../lib/resend";
import { calculateLifeStats } from "../lib/calculations";
import { weekOfLife } from "../lib/weeks";
import { pickRandomQuote } from "../lib/quotes";

async function main() {
  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
  });

  console.log(`[send-weekly] ${subs.length} subscriptions to evaluate`);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subs) {
    const currentWeek = weekOfLife(sub.birthDate, now);
    const totalWeeks = sub.lifeExpectancy * 52;

    if (currentWeek <= sub.lastSentWeek) {
      skipped++;
      continue;
    }
    if (currentWeek >= totalWeeks) {
      skipped++;
      continue;
    }

    const stats = calculateLifeStats(sub.birthDate, sub.lifeExpectancy, now);
    const quote = pickRandomQuote();

    try {
      await sendWeeklyEmail({
        to: sub.email,
        currentWeek,
        totalWeeks,
        stats,
        quote,
        unsubscribeToken: sub.unsubscribeToken,
      });
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { lastSentWeek: currentWeek, lastSentAt: now },
      });
      sent++;
      console.log(`[send-weekly] sent to ${sub.email} (week ${currentWeek})`);
    } catch (err) {
      failed++;
      console.error(`[send-weekly] failed for ${sub.email}`, err);
    }
  }

  console.log(
    `[send-weekly] done — sent=${sent} skipped=${skipped} failed=${failed}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[send-weekly] fatal", err);
    await prisma.$disconnect();
    process.exit(1);
  });
