import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { LivePreview } from '@/components/landing/live-preview';
import { FeaturesSection } from '@/components/landing/features-section';
import { StatsSection } from '@/components/landing/stats-section';
import { CtaSection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1c1c1c] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#1c1c1c]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <LivePreview />
        <FeaturesSection />
        <StatsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
