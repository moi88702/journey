import { useStreak } from "../hooks/useStreaks";
import type { Habit } from "../types";

interface Props {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitRow({ habit, completed, onToggle }: Props) {
  const streak = useStreak(habit.id) ?? 0;

  return (
    <li className={`habit-row ${completed ? "habit-done" : ""}`}>
      <button
        className={`habit-check ${completed ? "habit-check--done" : ""}`}
        onClick={onToggle}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        style={completed ? { background: habit.color, borderColor: habit.color } : {}}
      >
        {completed && <span className="checkmark">✓</span>}
      </button>

      <span className="habit-emoji">{habit.emoji}</span>
      <span className="habit-name">{habit.name}</span>

      {streak > 1 && (
        <span className="habit-streak" title={`${streak}-day streak`}>
          🔥 {streak}
        </span>
      )}
    </li>
  );
}
