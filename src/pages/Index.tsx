import { Link } from "react-router-dom";
import { Camera, Ruler, ShoppingBag, ArrowRight, Star, Zap, Heart } from "lucide-react";
import GradientButton from "@/components/GradientButton";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Camera,
    title: "AI Outfit Analysis",
    description: "Upload any influencer photo. Our Claude AI instantly identifies every clothing item, brand, and style element.",
  },
  {
    icon: Ruler,
    title: "Size-Smart Matching",
    description: "Enter your measurements once. Get product recommendations perfectly calibrated to your unique body.",
  },
  {
    icon: ShoppingBag,
    title: "Shop the Look",
    description: "Discover exact matches and budget-friendly dupes from hundreds of retailers — all in your size.",
  },
];

const steps = [
  { number: "01", title: "Upload the Look", desc: "Share a screenshot of your favorite influencer's outfit." },
  { number: "02", title: "AI Identifies Items", desc: "Claude AI breaks down every piece — jacket, shoes, accessories." },
  { number: "03", title: "Get Your Matches", desc: "We find the same (or similar) items available in your exact size." },
];

const testimonials = [
  { name: "Sofia R.", size: "Size 14", quote: "Finally found that exact blazer from Emma Chamberlain's vlog — in MY size!", stars: 5 },
  { name: "Priya K.", size: "Size 6", quote: "Saved me hours of hunting. The AI is scarily accurate at identifying brands.", stars: 5 },
  { name: "Mia T.", size: "Size 18", quote: "As a plus-size girlie, I always struggle. MatchMyStyle changed the game for me.", stars: 5 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Fashion hero"
            className="w-full h-full object-cover object-top sm:object-center opacity-50 sm:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 50%, hsl(271 76% 57% / 0.15) 0%, transparent 70%)" }} />
        </div>

      {/* Hero content */}
        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-2 mb-6 text-sm font-medium text-primary">
              <Zap className="w-4 h-4" />
              <span>Powered by AI</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
              Wear the Looks
              <br />
              <span className="text-gradient italic">You Obsess Over</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Upload any influencer outfit. Our AI identifies every item and finds them in{" "}
              <strong className="text-foreground">your exact size</strong> — from luxury to budget dupes.
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
                className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-primary text-primary hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all duration-300 text-lg px-8 py-4"
              >
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["#a855f7", "#ec4899", "#7c3aed"].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-background" style={{ background: c }} />
                  ))}
                </div>
                <span>12k+ outfits matched</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-pink text-brand-pink" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent cards */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 z-10 animate-float">
          <div className="glass rounded-2xl p-4 w-56 shadow-brand">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">Item Detected</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Blazer • Zara • ~$89</p>
            <div className="text-xs font-medium text-gradient">3 matches in size M found ✓</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, hsl(271 76% 57% / 0.06) 0%, transparent 60%)" }} />
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              AI-Powered Fashion{" "}
              <span className="text-gradient italic">at Your Fingertips</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-2xl p-8 group hover:border-primary transition-all duration-300 hover:shadow-brand">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="how-it-works" className="py-24 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Three Steps to{" "}
              <span className="text-gradient italic">Your Perfect Look</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-brand opacity-30" />

            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-brand font-display text-xl font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Loved by Fashion{" "}
              <span className="text-gradient italic">Enthusiasts</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-pink text-brand-pink" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed italic font-display">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.size}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="glass-light rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(271 76% 57% / 0.15) 0%, transparent 70%)" }} />
            <Heart className="w-10 h-10 mx-auto mb-6 text-secondary animate-pulse" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 relative z-10">
              Start Matching{" "}
              <span className="text-gradient italic">Your Style</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 relative z-10 max-w-md mx-auto">
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
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-gradient">MatchMyStyle</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 MatchMyStyle. Find your perfect fit.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
