import { useCallback, useEffect, useRef, useState } from "react";
import { useHabits } from "./hooks/useHabits";
import { useDay } from "./hooks/useDay";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { HabitRow } from "./components/HabitRow";
import { HabitManager } from "./components/HabitManager";
import { MoodPicker } from "./components/MoodPicker";
import { YamlModal } from "./components/YamlModal";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const todayStr = toDateStr(new Date());
  if (dateStr === todayStr) return "Today";
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === toDateStr(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

// Debounce helper
function useDebounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: T) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]);
}

export default function App() {
  const [dateStr, setDateStr] = useState(toDateStr(new Date()));
  const [showManager, setShowManager] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [journalText, setJournalText] = useState("");

  const { habits, loading: habitsLoading, addHabit, deleteHabit, reorderHabits } = useHabits();
  const { canInstall, install } = useInstallPrompt();
  const { journal, completionMap, completedCount, toggleHabit, saveJournal, setMood } =
    useDay(dateStr, habits);

  // Sync textarea with loaded journal entry
  useEffect(() => {
    setJournalText(journal?.text ?? "");
  }, [journal?.text, dateStr]);

  const debouncedSave = useDebounce(saveJournal, 600);

  function handleJournalChange(text: string) {
    setJournalText(text);
    debouncedSave(text);
  }

  function navigate(delta: number) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const next = toDateStr(d);
    // Don't navigate into the future
    if (next <= toDateStr(new Date())) setDateStr(next);
  }

  const isToday = dateStr === toDateStr(new Date());
  const totalHabits = habits.length;
  const pct = totalHabits ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Hold render until IndexedDB is ready — prevents the empty-state flash on load
  if (habitsLoading) return null;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <button className="icon-btn nav-btn" onClick={() => navigate(-1)} aria-label="Previous day">‹</button>
        <div className="header-center">
          <h1 className="header-date">{formatDate(dateStr)}</h1>
          {totalHabits > 0 && (
            <span className="header-progress">{completedCount}/{totalHabits} habits</span>
          )}
        </div>
        <button
          className="icon-btn nav-btn"
          onClick={() => navigate(1)}
          disabled={isToday}
          aria-label="Next day"
        >›</button>
      </header>

      {/* Progress bar */}
      {totalHabits > 0 && (
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${pct}%`, opacity: pct === 100 ? 1 : 0.7 }}
          />
        </div>
      )}

      <main className="main">
        {/* Habits section */}
        <section className="card">
          <div className="section-header">
            <span className="section-label">Habits</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowManager(true)}>
              Edit
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="empty-hint">
              No habits yet.{" "}
              <button className="link-btn" onClick={() => setShowManager(true)}>Add some →</button>
            </p>
          ) : (
            <ul className="habit-list">
              {habits.map((h) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  completed={completionMap.get(h.id!) === true}
                  onToggle={() => toggleHabit(h.id!)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Mood */}
        <section className="card">
          <MoodPicker value={journal?.mood ?? null} onChange={setMood} />
        </section>

        {/* Journal */}
        <section className="card journal-card">
          <span className="section-label">Journal</span>
          <textarea
            className="journal-textarea"
            placeholder={isToday ? "How's today going…" : "Notes for this day…"}
            value={journalText}
            onChange={(e) => handleJournalChange(e.target.value)}
          />
          {journal?.updatedAt && (
            <span className="save-indicator">
              Saved {new Date(journal.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </section>
      </main>

      {/* Footer nav */}
      <footer className="app-footer">
        {!isToday && (
          <button className="btn btn-ghost btn-sm" onClick={() => setDateStr(toDateStr(new Date()))}>
            Back to today
          </button>
        )}
        {canInstall && (
          <button className="icon-btn install-btn" onClick={install} title="Install app">
            ⊕
          </button>
        )}
        <button className="icon-btn yaml-btn" onClick={() => setShowYaml(true)} title="Export / Import">
          ⇅
        </button>
      </footer>

      {showManager && (
        <HabitManager
          habits={habits}
          onAdd={addHabit}
          onDelete={deleteHabit}
          onReorder={reorderHabits}
          onClose={() => setShowManager(false)}
        />
      )}
      {showYaml && <YamlModal onClose={() => setShowYaml(false)} />}
    </div>
  );
}
