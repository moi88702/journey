import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <section className="card" style={{ color: "var(--danger)", fontSize: 13, padding: 16 }}>
          ⚠ Section error: {this.state.error.message}
        </section>
      );
    }
    return this.props.children;
  }
}
