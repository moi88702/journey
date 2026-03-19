export interface Habit {
  id?: number;
  name: string;
  emoji: string;
  color: string;
  order: number;
  createdAt: number;
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: string;   // YYYY-MM-DD
  completed: boolean;
}

export interface JournalEntry {
  id?: number;
  date: string;   // YYYY-MM-DD
  text: string;
  mood: number | null;  // 1–5, null = not set
  updatedAt: number;
}

export interface Todo {
  id?: number;
  text: string;
  completed: boolean;
  order: number;
  createdAt: number;
}

// YAML export shape
export type YamlExport = {
  exportedAt: string;
  habits: Array<{
    name: string;
    emoji: string;
    color: string;
  }>;
  entries: Array<{
    date: string;
    mood: number | null;
    journal: string;
    habits: Array<{ name: string; completed: boolean }>;
  }>;
};
