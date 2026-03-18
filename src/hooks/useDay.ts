import { useEffect, useState } from "react";
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

  // Optimistic state: habitId → completed, cleared once Dexie confirms
  const [optimistic, setOptimistic] = useState<Map<number, boolean>>(new Map());

  // When Dexie delivers updated entries, wipe the optimistic overrides
  useEffect(() => {
    setOptimistic(new Map());
  }, [entries]);

  async function toggleHabit(habitId: number) {
    // Flip immediately so the tick appears without waiting for DB round-trip
    const currentValue = dbMap.get(habitId) ?? false;
    setOptimistic((prev) => new Map(prev).set(habitId, !currentValue));

    try {
      const existing = await db.habitEntries
        .where("[habitId+date]")
        .equals([habitId, date])
        .first();

      if (existing) {
        await db.habitEntries.update(existing.id!, { completed: !existing.completed });
      } else {
        await db.habitEntries.add({ habitId, date, completed: true });
      }
    } catch {
      // Revert optimistic update on failure
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(habitId);
        return next;
      });
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

  // DB-confirmed state
  const dbMap = new Map(
    (entries ?? []).map((e) => [e.habitId, e.completed])
  );

  // Merge: optimistic overrides DB until Dexie confirms
  const completionMap = new Map(dbMap);
  for (const [habitId, completed] of optimistic) {
    completionMap.set(habitId, completed);
  }

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
