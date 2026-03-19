import Dexie, { type Table } from "dexie";
import type { Todo } from "../types";

class TodoDatabase extends Dexie {
  todos!: Table<Todo>;

  constructor() {
    super("MoiTodos");
    this.version(1).stores({
      todos: "++id, order, completed, createdAt",
    });
  }
}

export const todosDb = new TodoDatabase();
