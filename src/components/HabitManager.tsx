import { useEffect, useState } from "react";
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
import type { Habit } from "../types";

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];
const EMOJIS = ["🏃","📚","🧘","🚫","😴","💧","🥗","🏋️","🎯","✍️","💊","🚴","🫁","🙏","🎵","🌿"];

interface Props {
  habits: Habit[];
  onAdd: (name: string, emoji: string, color: string) => void;
  onDelete: (id: number) => void;
  onReorder: (reordered: Habit[]) => void;
  onClose: () => void;
}

interface SortableRowProps {
  habit: Habit;
  onDelete: (id: number) => void;
}

function SortableHabitRow({ habit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="habit-manage-item">
      <button
        className="drag-handle"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >⠿</button>
      <span className="habit-emoji">{habit.emoji}</span>
      <span style={{ flex: 1 }}>{habit.name}</span>
      <span className="habit-color-dot" style={{ background: habit.color }} />
      <button
        className="icon-btn"
        onClick={() => onDelete(habit.id!)}
        aria-label={`Delete ${habit.name}`}
      >✕</button>
    </li>
  );
}

export function HabitManager({ habits, onAdd, onDelete, onReorder, onClose }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏃");
  const [color, setColor] = useState(COLORS[0]!);

  // Local optimistic order — updates immediately on drag, persists via onReorder
  const [localHabits, setLocalHabits] = useState<Habit[]>(habits);

  // Keep in sync if parent habits change (add/delete)
  useEffect(() => { setLocalHabits(habits); }, [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localHabits.findIndex((h) => h.id === active.id);
    const newIndex = localHabits.findIndex((h) => h.id === over.id);
    const reordered = arrayMove(localHabits, oldIndex, newIndex);
    setLocalHabits(reordered);
    onReorder(reordered);
  }

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, emoji, color);
    setName("");
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Manage Habits</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Sortable habit list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localHabits.map((h) => h.id!)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="habit-manage-list">
              {localHabits.map((h) => (
                <SortableHabitRow key={h.id} habit={h} onDelete={onDelete} />
              ))}
              {localHabits.length === 0 && <li className="modal-hint">No habits yet.</li>}
            </ul>
          </SortableContext>
        </DndContext>

        <hr className="divider" />

        {/* Add new habit */}
        <div className="add-habit-form">
          <p className="modal-hint">Add a habit</p>

          <div className="emoji-picker">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`emoji-btn ${e === emoji ? "selected" : ""}`}
                onClick={() => setEmoji(e)}
              >{e}</button>
            ))}
          </div>

          <input
            className="input"
            placeholder="Habit name…"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === "Enter") handleAdd(); }}
          />

          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${c === color ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleAdd} disabled={!name.trim()}>
            Add habit
          </button>
        </div>
      </div>
    </div>
  );
}
