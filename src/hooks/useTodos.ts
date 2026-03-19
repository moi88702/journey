import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import type { Todo } from "../types";

export function useTodos() {
  const todos = useLiveQuery(() => db.todos.orderBy("order").toArray(), []);

  async function addTodo(text: string) {
    const count = await db.todos.count();
    return db.todos.add({ text, completed: false, order: count, createdAt: Date.now() });
  }

  async function toggleTodo(id: number) {
    const existing = await db.todos.get(id);
    if (existing) {
      await db.todos.update(id, { completed: !existing.completed });
    }
  }

  async function deleteTodo(id: number) {
    await db.todos.delete(id);
  }

  async function reorderTodos(reordered: Todo[]) {
    await db.transaction("rw", db.todos, async () => {
      for (let i = 0; i < reordered.length; i++) {
        await db.todos.update(reordered[i].id!, { order: i });
      }
    });
  }

  return {
    todos: todos ?? [],
    loading: todos === undefined,
    addTodo,
    toggleTodo,
    deleteTodo,
    reorderTodos,
  };
}
