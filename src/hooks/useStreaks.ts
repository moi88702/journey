import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function useStreak(habitId: number | undefined) {
  return useLiveQuery(async () => {
    if (habitId == null) return 0;
    let streak = 0;
    let offset = 0;
    // Walk backwards from today counting consecutive completed days
    while (true) {
      const date = daysAgo(offset);
      const entry = await db.habitEntries
        .where("[habitId+date]")
        .equals([habitId, date])
        .first();
      if (entry?.completed) {
        streak++;
        offset++;
      } else {
        // Allow today to be incomplete without breaking streak
        if (offset === 0) { offset++; continue; }
        break;
      }
      if (offset > 365) break; // safety
    }
    return streak;
  }, [habitId, today()]);
}
