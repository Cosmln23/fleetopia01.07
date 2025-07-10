// Railway Cron Wrapper for Trial Management Jobs
// This file decides which cron job to run based on the current hour
//
// Railway cron schedule: 0 6,22 * * *
// - 06:00 UTC (09:00 Romania) = Trial reminders
// - 22:00 UTC (01:00 Romania) = Expire trials

const now = new Date();
const hour = now.getUTCHours();

console.log(`🕐 Cron wrapper started at ${now.toISOString()} (UTC hour: ${hour})`);

if (hour === 6) {
  console.log("🔔 Running trial-reminders at 06 UTC (09:00 Romania time)");
  try {
    require("./scripts/trial-reminders.js");
  } catch (error) {
    console.error("❌ Error running trial-reminders:", error);
    process.exit(1);
  }
} else if (hour === 22) {
  console.log("⏰ Running expire-trials at 22 UTC (01:00 Romania time)");
  try {
    require("./scripts/expire-trials.js");
  } catch (error) {
    console.error("❌ Error running expire-trials:", error);
    process.exit(1);
  }
} else {
  console.log(`ℹ️  No job scheduled for hour ${hour}. Expected hours: 6 or 22 UTC.`);
  console.log("📅 Schedule:");
  console.log("   - 06:00 UTC (09:00 Romania): Trial reminders");
  console.log("   - 22:00 UTC (01:00 Romania): Expire trials");
}

console.log("✅ Cron wrapper completed");