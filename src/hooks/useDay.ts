import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import type { Habit } from "../types";

export function useDay(date: string, habits: Habit[]) {
  const entries = useLiveQuery(
    () => db.habitEntries.where("date").equals(date).toArray(),
    [date]
  );

  const journal = useLiveQuery(
    () => db.journal.where("date").equals(date).first(),
    [date]
  );

  async function toggleHabit(habitId: number) {
    const existing = await db.habitEntries
      .where("[habitId+date]")
      .equals([habitId, date])
      .first();

    if (existing) {
      await db.habitEntries.update(existing.id!, { completed: !existing.completed });
    } else {
      await db.habitEntries.add({ habitId, date, completed: true });
    }
  }

  async function saveJournal(text: string) {
    const existing = await db.journal.where("date").equals(date).first();
    if (existing) {
      await db.journal.update(existing.id!, { text, updatedAt: Date.now() });
    } else if (text.trim()) {
      await db.journal.add({ date, text, mood: null, updatedAt: Date.now() });
    }
  }

  async function setMood(mood: number | null) {
    const existing = await db.journal.where("date").equals(date).first();
    if (existing) {
      await db.journal.update(existing.id!, { mood, updatedAt: Date.now() });
    } else {
      await db.journal.add({ date, text: "", mood, updatedAt: Date.now() });
    }
  }

  // Build a map of habitId → completed for quick lookup
  const completionMap = new Map(
    (entries ?? []).map((e) => [e.habitId, e.completed])
  );

  const completedCount = habits.filter(
    (h) => completionMap.get(h.id!) === true
  ).length;

  return {
    entries: entries ?? [],
    journal,
    completionMap,
    completedCount,
    toggleHabit,
    saveJournal,
    setMood,
  };
}
