import type { FormEvent } from "react";
import { ArrowUp, Mic } from "lucide-react";

interface Props {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
  inline?: boolean;
  /** Redesign "brief bar": one big square field with a voice button and an Ask button, placed at the top. */
  brief?: boolean;
}

const ConciergeComposer = ({ value, loading, onChange, onSubmit, placeholder, inline, brief }: Props) => {
  if (brief) {
    const ready = value.trim().length >= 2;
    return (
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex flex-wrap" style={{ border: "2px solid var(--concierge-ink)" }}>
          <label htmlFor="concierge-input" className="sr-only">tell the concierge what you want</label>
          <input
            id="concierge-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={300}
            placeholder={placeholder ?? "e.g. a camel coat that works with wide-leg jeans"}
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            className="h-[60px] w-full min-w-0 bg-white sm:w-auto sm:flex-1 px-4 text-[18px] outline-none placeholder:text-[var(--concierge-soft-ink)] sm:h-[64px] sm:px-5 sm:text-[20px]"
            style={{ fontFamily: "Newsreader, Georgia, serif" }}
          />
          <div className="flex w-full border-t border-[#D5D2CB] sm:w-auto sm:border-t-0">
            <button type="button" aria-label="voice input, coming soon" title="voice is coming soon"
              className="flex h-[52px] w-[60px] flex-col items-center justify-center bg-white sm:h-[64px] sm:w-[64px]"
              style={{ borderLeft: "1px solid #D5D2CB", color: "var(--concierge-soft-ink)" }}>
              <Mic className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-[0.08em]">soon</span>
            </button>
            <button type="submit" disabled={loading || !ready}
              className="mono-ink-bg h-[52px] flex-1 px-6 text-[13px] font-bold uppercase tracking-[0.12em] disabled:opacity-50 sm:h-[64px] sm:flex-none sm:px-8">
              {loading ? "Looking…" : "Ask"}
            </button>
          </div>
        </div>
      </form>
    );
  }
  return (
    <form onSubmit={onSubmit} className={inline ? "mt-3 md:mt-5" : "mono-bg sticky bottom-0 z-20 border-t border-transparent px-4 pb-4 pt-3 sm:px-6"}>
      <div className={inline ? "flex items-center gap-3" : "mx-auto flex max-w-6xl items-center gap-3"}>
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
};

export default ConciergeComposer;
