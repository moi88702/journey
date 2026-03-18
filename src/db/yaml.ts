import { dump, load } from "js-yaml";
import { db } from "./database";
import type { YamlExport } from "../types";

export async function exportToYaml(): Promise<string> {
  const habits = await db.habits.orderBy("order").toArray();
  const allEntries = await db.habitEntries.orderBy("date").toArray();
  const allJournal = await db.journal.orderBy("date").toArray();

  // Gather unique dates across habit entries and journal entries
  const dates = [...new Set([
    ...allEntries.map((e) => e.date),
    ...allJournal.map((j) => j.date),
  ])].sort();

  const result: YamlExport = {
    exportedAt: new Date().toISOString(),
    habits: habits.map((h) => ({ name: h.name, emoji: h.emoji, color: h.color })),
    entries: dates.map((date) => {
      const journal = allJournal.find((j) => j.date === date);
      const dayEntries = allEntries.filter((e) => e.date === date);
      return {
        date,
        mood: journal?.mood ?? null,
        journal: journal?.text ?? "",
        habits: habits.map((h) => ({
          name: h.name,
          completed: dayEntries.find((e) => e.habitId === h.id)?.completed ?? false,
        })),
      };
    }),
  };

  return dump(result, { lineWidth: 120 });
}

export async function importFromYaml(yamlStr: string): Promise<void> {
  const data = load(yamlStr) as YamlExport;
  if (!data?.habits) throw new Error("Invalid YAML: missing 'habits' key");

  await db.transaction("rw", db.habits, db.habitEntries, db.journal, async () => {
    await db.habitEntries.clear();
    await db.journal.clear();
    await db.habits.clear();

    const habitIds: number[] = [];
    for (let i = 0; i < data.habits.length; i++) {
      const h = data.habits[i];
      const id = await db.habits.add({
        name: h.name,
        emoji: h.emoji ?? "•",
        color: h.color ?? "#22c55e",
        order: i,
        createdAt: Date.now(),
      });
      habitIds.push(id as number);
    }

    for (const entry of data.entries ?? []) {
      if (entry.journal || entry.mood != null) {
        await db.journal.add({
          date: entry.date,
          text: entry.journal ?? "",
          mood: entry.mood ?? null,
          updatedAt: Date.now(),
        });
      }
      for (let i = 0; i < (entry.habits ?? []).length; i++) {
        const h = entry.habits[i];
        const habitId = habitIds[i];
        if (habitId != null) {
          await db.habitEntries.add({ habitId, date: entry.date, completed: h.completed ?? false });
        }
      }
    }
  });
}

export function downloadYaml(yamlStr: string) {
  const blob = new Blob([yamlStr], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `journal-${new Date().toISOString().split("T")[0]}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}
