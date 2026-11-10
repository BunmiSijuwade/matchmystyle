// About, Privacy and Terms pages in the redesign style. Copy describes only what the app actually does.
import type { ReactNode } from "react";
import { TopNav, TabBar, SiteFooter } from "@/components/v2/SiteNav";
import { V2 } from "@/lib/redesign";

const UPDATED = "November 10, 2026";
const display = { fontFamily: V2.display, fontWeight: 800 } as const;

function Shell({ title, updated, children }: { title: string; updated?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ background: V2.paper, color: V2.ink }}>
      <TopNav active="home" />
      <main className="max-w-3xl mx-auto px-5 lg:px-8 pt-8 lg:pt-14">
        <h1 className="text-[36px] lg:text-[52px] leading-[1.02] tracking-[-1px]" style={display}>{title}</h1>
        {updated && <p className="mt-2 text-[13px]" style={{ color: V2.muted }}>Last updated {UPDATED}</p>}
        <div className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed" style={{ color: V2.muted }}>{children}</div>
      </main>
      <SiteFooter />
      <TabBar active="home" />
    </div>
  );
}

const H2 = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2 id={id} className="mt-6 text-[22px] lg:text-[28px] tracking-[-0.4px] scroll-mt-6" style={{ ...display, color: V2.ink }}>{children}</h2>
);
const Q = ({ q, children }: { q: string; children: ReactNode }) => (
  <div className="rounded-2xl border p-4" style={{ background: V2.card, borderColor: V2.line }}>
    <h3 className="text-[17px] font-bold" style={{ color: V2.ink }}>{q}</h3>
    <p className="mt-1">{children}</p>
  </div>
);
const Mail = () => <a href="mailto:bunmi007@gmail.com" className="font-bold underline" style={{ color: V2.ink }}>bunmi007@gmail.com</a>;

export function About() {
  return (
    <Shell title="About MatchMyStyle">
      <p>The outfits you see online are rarely linked. When they are, the piece is often out of budget, sold out, or not made in your size.</p>
      <p>MatchMyStyle closes that gap. Add a photo or describe a look, and we name every piece in it: the coat, the top, the trousers, the shoes. Then we show real products you can buy, at budget, mid-range and luxury prices, plus secondhand options from resale marketplaces.</p>
      <p>Save your measurements once and the matches lean toward your size. You can also ask the Concierge to build a whole look for an occasion, swap pieces you don't love, and save a look card to share.</p>
      <H2 id="faq">FAQ</H2>
      <Q q="Do I need an account?">No. Everything works without signing up.</Q>
      <Q q="How does sizing work?">Add your measurements in Closet for closer matches. They are saved in your browser and used to point searches at your size.</Q>
      <Q q="Where do products come from?">Real retailers via Shopify's catalog. Links go straight to the store, where you check out as normal. Secondhand options link to searches on resale marketplaces.</Q>
      <Q q="What happens to my photo?">It is sent to our analysis service and an AI model to identify the pieces, then the result comes back to your browser. We don't save your photo to a database or file storage, and it stays only in this browser tab while you look at your results.</Q>
    </Shell>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy" updated>
      <p>This is a plain-language summary of what MatchMyStyle does with your information.</p>
      <H2>Photos and descriptions</H2>
      <p>When you add a photo, paste an image link or describe a look, it is sent to our analysis service, which uses an AI model to identify the clothing. We don't save your photo to a database or file storage. The results are kept in your browser for the session.</p>
      <H2>Measurements and preferences</H2>
      <p>Measurements you add in Closet, your Concierge conversation and recent searches are saved in your browser's local storage on your device. They are not tied to an account. Clearing your browser data removes them.</p>
      <H2>Usage limits</H2>
      <p>To keep the service free and fair, we count requests per network address for a short time to apply daily limits. We don't use this to identify you.</p>
      <H2>Store links</H2>
      <p>Product links take you to other stores and marketplaces. Once you leave MatchMyStyle, their own privacy policies apply. We may earn a commission when you buy through a link.</p>
      <H2>No accounts, no selling data</H2>
      <p>You don't need an account, and we don't sell your personal information.</p>
      <H2>Contact</H2>
      <p>Questions? Email <Mail />.</p>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms" updated>
      <p>By using MatchMyStyle you agree to these terms. They are written to be read.</p>
      <H2>What we provide</H2>
      <p>MatchMyStyle identifies clothing in photos and descriptions and suggests similar products from other stores. Identification is automated and can be wrong, so check each product before you buy.</p>
      <H2>Purchases</H2>
      <p>We don't sell anything. Prices, stock, sizes, shipping and returns are set by the store you buy from, and your purchase is between you and that store. Prices shown may change.</p>
      <H2>Your uploads</H2>
      <p>Only upload photos you have the right to use. Don't upload anything illegal or harmful.</p>
      <H2>Fair use</H2>
      <p>There are daily usage limits. Don't try to get around them, overload the service or scrape it.</p>
      <H2>Commissions</H2>
      <p>We may earn a commission when you shop through our links. It never changes the price you pay.</p>
      <H2>No guarantees</H2>
      <p>The service is provided as is. We may change or pause features at any time.</p>
      <H2>Contact</H2>
      <p>Questions? Email <Mail />.</p>
    </Shell>
  );
}
