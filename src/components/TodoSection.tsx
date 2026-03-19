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
  dateStr: string;
  isToday: boolean;
  onAdd: (text: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (reordered: Todo[]) => void;
}

interface SortableRowProps {
  todo: Todo;
  isToday: boolean;
  completedOnDay: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function SortableTodoRow({ todo, isToday, completedOnDay, onToggle, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id!, disabled: !isToday });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="todo-row">
      {isToday && (
        <button className="drag-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </button>
      )}
      <button
        className={`habit-check ${completedOnDay ? "habit-check--done" : ""}`}
        onClick={() => isToday && onToggle(todo.id!)}
        aria-label={completedOnDay ? "Mark incomplete" : "Mark complete"}
        style={completedOnDay ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
        disabled={!isToday}
      >
        {completedOnDay && <span className="checkmark">✓</span>}
      </button>
      <span className={`todo-text ${completedOnDay ? "todo-done" : ""}`}>{todo.text}</span>
      {todo.completedAt && !isToday && (
        <span className="todo-date-badge">{todo.completedAt}</span>
      )}
      {isToday && (
        <button
          className="icon-btn todo-delete"
          onClick={() => onDelete(todo.id!)}
          aria-label="Delete todo"
        >✕</button>
      )}
    </li>
  );
}

export function TodoSection({ todos, dateStr, isToday, onAdd, onToggle, onDelete, onReorder }: Props) {
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

  // For past-day view: show todos that existed on that day OR were completed on that day
  const visibleTodos = isToday
    ? localTodos
    : localTodos.filter((t) => {
        const createdDate = new Date(t.createdAt).toISOString().split("T")[0]!;
        return createdDate <= dateStr || t.completedAt === dateStr;
      });

  // Completion status — today uses current state, past uses completedAt
  function isCompletedOnDay(todo: Todo): boolean {
    if (isToday) return todo.completed;
    return !!todo.completedAt && todo.completedAt <= dateStr;
  }

  const filtered = visibleTodos.filter((t) => {
    const done = isCompletedOnDay(t);
    if (filter === "todo") return !done;
    if (filter === "done") return done;
    return true;
  });

  const doneCount = visibleTodos.filter((t) => isCompletedOnDay(t)).length;
  const todoCount = visibleTodos.filter((t) => !isCompletedOnDay(t)).length;

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
              {f === "all" ? `All ${visibleTodos.length}` : f === "todo" ? `Todo ${todoCount}` : `Done ${doneCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Inline add — today only */}
      {isToday && (
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
      )}

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
                {filter === "done"
                  ? isToday ? "Nothing done yet." : "Nothing completed this day."
                  : filter === "todo"
                  ? isToday ? "All caught up! 🎉" : "Everything was done! 🎉"
                  : isToday ? "No todos yet." : "No todos for this day."}
              </li>
            ) : (
              filtered.map((t) => (
                <SortableTodoRow
                  key={t.id}
                  todo={t}
                  isToday={isToday}
                  completedOnDay={isCompletedOnDay(t)}
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
