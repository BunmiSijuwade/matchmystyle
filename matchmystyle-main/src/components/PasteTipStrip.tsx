import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const STORAGE_KEY = "mms_paste_tip_dismissed";

const steps = [
  { icon: "🔍", title: "Find it", desc: "Search on Google Lens or open on Instagram" },
  { icon: "📋", title: "Copy it", desc: "Right-click → Copy Image" },
  { icon: "✨", title: "Paste here", desc: "Click the zone above & press Ctrl+V" },
];

const platforms = ["Google Lens", "Instagram", "Pinterest", "TikTok", "Any browser"];

const PasteTipStrip = () => {
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== "true");

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) localStorage.setItem(STORAGE_KEY, "true");
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="hidden md:block">
      <Collapsible open={open} onOpenChange={handleToggle}>
        <div className="bg-card border border-border rounded-xl px-3.5 py-3">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between text-left group">
              <span className="text-xs font-medium text-foreground">💡 How to copy from Google Lens</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 group-hover:text-foreground transition-colors">
                {open ? (
                  <>hide <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>show <ChevronDown className="w-3 h-3" /></>
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
            <div className="pt-3 space-y-3">
              {/* Steps */}
              <div className="flex items-start justify-center gap-2">
                {steps.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-2">
                    <div className="flex flex-col items-center text-center min-w-[100px]">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm mb-1.5">
                        {step.icon}
                      </div>
                      <span className="text-[11px] font-medium text-foreground">{step.title}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <span className="text-muted-foreground text-xs mt-3 flex-shrink-0">›</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Platform pills */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {platforms.map((p) => (
                  <span key={p} className="bg-muted rounded-[10px] px-2 py-0.5 text-[9px] text-muted-foreground">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

export default PasteTipStrip;
