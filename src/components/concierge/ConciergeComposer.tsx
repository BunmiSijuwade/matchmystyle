import type { FormEvent } from "react";
import { ArrowUp, Mic } from "lucide-react";

interface Props {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
}

const ConciergeComposer = ({ value, loading, onChange, onSubmit, placeholder }: Props) => (
  <form onSubmit={onSubmit} className="mono-bg sticky bottom-0 z-20 border-t border-transparent px-4 pb-4 pt-3 sm:px-6">
    <div className="mx-auto flex max-w-6xl items-center gap-3">
      <label htmlFor="concierge-input" className="sr-only">tell the concierge what you want</label>
      <div className="mono-outline mono-pill mono-panel flex min-h-[52px] flex-1 items-center pl-5 pr-1.5">
        <input
          id="concierge-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={300}
          placeholder={placeholder ?? "type it or say it..."}
          type="text"
          enterKeyHint="send"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--mono-soft-ink)]"
        />
        {value.trim().length >= 2 && (
          <button type="submit" disabled={loading} aria-label="send" className="mono-ink-bg mono-pill flex h-11 w-11 items-center justify-center disabled:opacity-50">
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      <button type="button" aria-label="voice input, coming soon" title="voice is coming soon" className="mono-accent-bg mono-pill flex h-[52px] w-[52px] shrink-0 items-center justify-center">
        <Mic className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  </form>
);

export default ConciergeComposer;
