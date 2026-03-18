const MOODS: [number, string, string][] = [
  [1, "😞", "Rough"],
  [2, "😕", "Meh"],
  [3, "😐", "OK"],
  [4, "🙂", "Good"],
  [5, "😄", "Great"],
];

interface Props {
  value: number | null;
  onChange: (mood: number | null) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="mood-picker">
      <span className="section-label">Mood</span>
      <div className="mood-options">
        {MOODS.map(([score, icon, label]) => (
          <button
            key={score}
            className={`mood-btn ${value === score ? "mood-btn--active" : ""}`}
            onClick={() => onChange(value === score ? null : score)}
            title={label}
            aria-label={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
