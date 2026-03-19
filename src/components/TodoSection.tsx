import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "../types";

type Filter = "all" | "todo" | "done";

interface Props {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (reordered: Todo[]) => void;
}

interface SortableRowProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function SortableTodoRow({ todo, onToggle, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="todo-row">
      <button className="drag-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </button>
      <button
        className={`habit-check ${todo.completed ? "habit-check--done" : ""}`}
        onClick={() => onToggle(todo.id!)}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        style={todo.completed ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
      >
        {todo.completed && <span className="checkmark">✓</span>}
      </button>
      <span className={`todo-text ${todo.completed ? "todo-done" : ""}`}>{todo.text}</span>
      <button
        className="icon-btn todo-delete"
        onClick={() => onDelete(todo.id!)}
        aria-label="Delete todo"
      >✕</button>
    </li>
  );
}

export function TodoSection({ todos, onAdd, onToggle, onDelete, onReorder }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [newText, setNewText] = useState("");
  const [localTodos, setLocalTodos] = useState<Todo[]>(todos);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalTodos(todos); }, [todos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorder within the full list, not just the filtered view
    const oldIndex = localTodos.findIndex((t) => t.id === active.id);
    const newIndex = localTodos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(localTodos, oldIndex, newIndex);
    setLocalTodos(reordered);
    onReorder(reordered);
  }

  function handleAdd() {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText("");
    inputRef.current?.focus();
  }

  const filtered = localTodos.filter((t) => {
    if (filter === "todo") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = localTodos.filter((t) => t.completed).length;
  const todoCount = localTodos.filter((t) => !t.completed).length;

  return (
    <section className="card">
      <div className="section-header">
        <span className="section-label">Todos</span>
        <div className="todo-filters">
          {(["all", "todo", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`todo-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `All ${localTodos.length}` : f === "todo" ? `Todo ${todoCount}` : `Done ${doneCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Inline add */}
      <div className="todo-add-row">
        <input
          ref={inputRef}
          className="input todo-input"
          placeholder="Add a todo…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
          disabled={!newText.trim()}
        >Add</button>
      </div>

      {/* List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filtered.map((t) => t.id!)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="todo-list">
            {filtered.length === 0 ? (
              <li className="empty-hint" style={{ padding: "12px 4px" }}>
                {filter === "done" ? "Nothing done yet." : filter === "todo" ? "All caught up! 🎉" : "No todos yet."}
              </li>
            ) : (
              filtered.map((t) => (
                <SortableTodoRow
                  key={t.id}
                  todo={t}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
