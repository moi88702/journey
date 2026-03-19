import { useLiveQuery } from "dexie-react-hooks";
import { todosDb } from "../db/todosDb";
import type { Todo } from "../types";

export function useTodos() {
  const todos = useLiveQuery(() => todosDb.todos.orderBy("order").toArray(), []);

  async function addTodo(text: string) {
    const count = await todosDb.todos.count();
    return todosDb.todos.add({ text, completed: false, order: count, createdAt: Date.now() });
  }

  async function toggleTodo(id: number) {
    const existing = await todosDb.todos.get(id);
    if (!existing) return;
    const nowCompleted = !existing.completed;
    const today = new Date().toISOString().split("T")[0];
    await todosDb.todos.update(id, {
      completed: nowCompleted,
      completedAt: nowCompleted ? today : undefined,
    });
  }

  async function deleteTodo(id: number) {
    await todosDb.todos.delete(id);
  }

  async function reorderTodos(reordered: Todo[]) {
    await todosDb.transaction("rw", todosDb.todos, async () => {
      for (let i = 0; i < reordered.length; i++) {
        await todosDb.todos.update(reordered[i].id!, { order: i });
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
