import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import GradientButton from "@/components/GradientButton";
import Navbar from "@/components/Navbar";
import TestimonialCarousel from "@/components/TestimonialCarousel";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://plus.unsplash.com/premium_vector-1724355762918-775a14a5c3d5?fm=jpg&q=80&w=2000&auto=format&fit=crop"
            alt="Fashion hero"
            className="w-full h-full object-cover object-top sm:object-center opacity-30 sm:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
        </div>

        {/* Hero content */}
        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 mb-6 text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground">
              <span>Powered by AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-light leading-[1.15] mb-6 tracking-[-1.2px]">
              Wear the Looks
              <br />
              <span className="text-gradient italic font-normal">You Obsess Over</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-[1.7] tracking-[0.2px]">
              Upload any influencer outfit. Our AI identifies every item and finds them in{" "}
              <strong className="text-foreground font-medium">your exact size</strong> — from luxury to budget dupes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/analyzer">
                <GradientButton size="lg" className="group min-h-[44px] w-full sm:w-auto">
                  Find My Style
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </GradientButton>
              </Link>
              <button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-[hsl(28,18%,78%)] text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary transition-all duration-300 text-[13px] font-medium uppercase tracking-[1.5px] px-8 py-4"
              >
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-6 mt-10 text-[11px] text-muted-foreground tracking-[0.5px]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["hsl(28,24%,44%)", "hsl(24,15%,54%)", "hsl(28,24%,44%)"].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-background" style={{ background: c }} />
                  ))}
                </div>
                <span>12k+ outfits matched</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent card */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-card border border-border rounded-2xl p-4 w-56 shadow-brand">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">📷</span>
              </div>
              <span className="text-[11px] font-medium tracking-[0.5px] uppercase text-muted-foreground">Item Detected</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Blazer · Zara · ~$89</p>
            <div className="text-xs font-medium text-primary">3 matches in size M found ✓</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-16" style={{ backgroundColor: "#FAFAF8", paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="container mx-auto px-5 sm:px-6">
          <div style={{ borderTop: "1px solid #E8DFD5", marginBottom: "48px" }} />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-10 sm:mb-14 tracking-[-1.2px]">
            Three Steps to{" "}
            <span className="text-gradient italic font-normal">Your Perfect Look</span>
          </h2>

          <div className="grid grid-cols-3 gap-3 sm:gap-8 max-w-2xl mx-auto">
            {[
              {
                title: "Upload",
                desc: "Share the look",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="16" width="14" height="4" rx="1" fill="#8B7355" opacity="0.4" />
                    <path d="M12 14V4M12 4L8 8M12 4L16 8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "AI Analyzes",
                desc: "Identifies items",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#8B7355" strokeWidth="2" opacity="0.4" />
                    <circle cx="12" cy="12" r="3" fill="#1A1A1A" />
                    <line x1="12" y1="1" x2="12" y2="5" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Shop",
                desc: "In your size",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6H4L2 16H20L18 6H16M6 6L8 2H16L18 6M6 6H18" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                    <circle cx="9" cy="20" r="2" fill="#1A1A1A" />
                    <circle cx="17" cy="20" r="2" fill="#1A1A1A" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.title} className="text-center flex flex-col items-center">
                <div
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center mb-3"
                  style={{
                    background: "linear-gradient(135deg, #F5EDE4, #E8DFD5)",
                    border: "1px solid #D4C4B8",
                  }}
                >
                  {step.icon}
                </div>
                <h3
                  className="mb-1"
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "#1A1A1A",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "10px",
                    fontWeight: 300,
                    color: "#999",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
          <div style={{ borderBottom: "1px solid #E8DFD5", marginTop: "48px" }} />
        </div>
      </section>

      {/* Testimonials Carousel */}
      <TestimonialCarousel />

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-muted rounded-3xl p-12 text-center relative overflow-hidden border border-border">
            <div className="divider" />
            <h2 className="text-4xl md:text-5xl font-light mb-4 relative z-10 tracking-[-1.2px]">
              Start Matching{" "}
              <span className="text-gradient italic font-normal">Your Style</span>
            </h2>
            <p className="text-muted-foreground text-base mb-8 relative z-10 max-w-md mx-auto leading-[1.7]">
              Join thousands of fashion lovers finding their perfect outfit matches every day.
            </p>
            <div className="flex justify-center gap-4 relative z-10">
              <Link to="/profile">
                <GradientButton size="lg">
                  Set Up My Profile
                </GradientButton>
              </Link>
              <Link to="/analyzer">
                <GradientButton variant="outline" size="lg">
                  Try the Analyzer
                </GradientButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0.5">
            <span className="text-base font-medium tracking-[-0.3px]">Match</span>
            <span className="text-base font-medium tracking-[-0.3px] text-gradient italic">My</span>
            <span className="text-base font-medium tracking-[-0.3px]">Style</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 MatchMyStyle. Find your perfect fit.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
