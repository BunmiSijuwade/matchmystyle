import { useState, useEffect, useCallback, useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Sofia R.", size: "Size 14", quote: "Finally found that exact blazer from Emma Chamberlain's vlog — in MY size!", stars: 5 },
  { name: "Priya K.", size: "Size 6", quote: "Saved me hours of hunting. The AI is scarily accurate at identifying brands.", stars: 5 },
  { name: "Mia T.", size: "Size 18", quote: "As a plus-size girlie, I always struggle. MatchMyStyle changed the game for me.", stars: 5 },
];

const TestimonialCarousel = () => {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const touchStart = useRef(0);

  const next = useCallback(() => setActive((i) => (i + 1) % testimonials.length), []);

  // Auto-rotate
  useEffect(() => {
    timer.current = setInterval(next, 5000);
    return () => clearInterval(timer.current);
  }, [next]);

  const resetTimer = () => {
    clearInterval(timer.current);
    timer.current = setInterval(next, 5000);
  };

  const goTo = (i: number) => {
    setActive(i);
    resetTimer();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      const dir = diff > 0 ? 1 : -1;
      setActive((i) => (i + dir + testimonials.length) % testimonials.length);
      resetTimer();
    }
  };

  const t = testimonials[active];

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-5 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-8">
          Loved by Fashion{" "}
          <span className="text-gradient italic">Enthusiasts</span>
        </h2>

        <div
          className="max-w-lg mx-auto text-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: t.stars }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-brand-pink text-brand-pink" />
            ))}
          </div>

          {/* Quote */}
          <p className="text-foreground leading-relaxed italic font-display text-base sm:text-lg mb-4 min-h-[3rem]">
            "{t.quote}"
          </p>

          {/* Avatar + Name */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {t.name[0]}
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-muted-foreground text-xs">{t.size}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === active ? "bg-primary w-5" : "bg-muted-foreground/40"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
