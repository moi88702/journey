import { useState } from "react";
import type { Habit } from "../types";

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];
const EMOJIS = ["🏃","📚","🧘","🚫","😴","💧","🥗","🏋️","🎯","✍️","💊","🚴","🫁","🙏","🎵","🌿"];

interface Props {
  habits: Habit[];
  onAdd: (name: string, emoji: string, color: string) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export function HabitManager({ habits, onAdd, onDelete, onClose }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏃");
  const [color, setColor] = useState(COLORS[0]);

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

        {/* Existing habits */}
        <ul className="habit-manage-list">
          {habits.map((h) => (
            <li key={h.id} className="habit-manage-item">
              <span className="habit-emoji">{h.emoji}</span>
              <span style={{ flex: 1 }}>{h.name}</span>
              <span className="habit-color-dot" style={{ background: h.color }} />
              <button
                className="icon-btn"
                onClick={() => onDelete(h.id!)}
                aria-label={`Delete ${h.name}`}
              >✕</button>
            </li>
          ))}
          {habits.length === 0 && <li className="modal-hint">No habits yet.</li>}
        </ul>

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
