import Dexie, { type Table } from "dexie";
import type { Habit, HabitEntry, JournalEntry } from "../types";

class JournalDatabase extends Dexie {
  habits!: Table<Habit>;
  habitEntries!: Table<HabitEntry>;
  journal!: Table<JournalEntry>;

  constructor() {
    super("MoiJournal");
    this.version(1).stores({
      habits:       "++id, order, createdAt",
      habitEntries: "++id, [habitId+date], date, habitId",
      journal:      "++id, &date",
    });
  }
}

export const db = new JournalDatabase();

// Seed default habits on first use
db.on("populate", async () => {
  const now = Date.now();
  const defaults: Omit<Habit, "id">[] = [
    { name: "Exercise",     emoji: "🏃", color: "#22c55e", order: 0, createdAt: now },
    { name: "Read",         emoji: "📚", color: "#3b82f6", order: 1, createdAt: now },
    { name: "Meditate",     emoji: "🧘", color: "#8b5cf6", order: 2, createdAt: now },
    { name: "No alcohol",   emoji: "🚫", color: "#f59e0b", order: 3, createdAt: now },
    { name: "8h sleep",     emoji: "😴", color: "#06b6d4", order: 4, createdAt: now },
  ];
  await db.habits.bulkAdd(defaults);
});
