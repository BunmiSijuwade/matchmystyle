import Navbar from "@/components/Navbar";
import HomePage from "@/components/home/HomePage";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HomePage />

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
}

export default Index;
