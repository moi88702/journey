import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import type { Habit } from "../types";

export function useHabits() {
  const habits = useLiveQuery(() => db.habits.orderBy("order").toArray(), []);

  async function addHabit(name: string, emoji: string, color: string) {
    const count = await db.habits.count();
    return db.habits.add({ name, emoji, color, order: count, createdAt: Date.now() });
  }

  async function updateHabit(id: number, changes: Partial<Habit>) {
    return db.habits.update(id, changes);
  }

  async function deleteHabit(id: number) {
    await db.transaction("rw", db.habits, db.habitEntries, async () => {
      await db.habitEntries.where("habitId").equals(id).delete();
      await db.habits.delete(id);
    });
  }

  // Accepts a reordered array and persists the new `order` values
  async function reorderHabits(reordered: Habit[]) {
    await db.transaction("rw", db.habits, async () => {
      for (let i = 0; i < reordered.length; i++) {
        await db.habits.update(reordered[i].id!, { order: i });
      }
    });
  }

  return { habits: habits ?? [], loading: habits === undefined, addHabit, updateHabit, deleteHabit, reorderHabits };
}
