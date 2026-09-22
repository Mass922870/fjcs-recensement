import { Hero } from "@/components/public/landing/hero";
import { WhySection } from "@/components/public/landing/why-section";
import { DataSection } from "@/components/public/landing/data-section";
import { FaqSection } from "@/components/public/landing/faq-section";
import { CtaSection } from "@/components/public/landing/cta-section";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <WhySection />
      <DataSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
}
