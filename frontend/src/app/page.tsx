import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { WorkflowSection } from "@/components/landing/workflow";
import { VerificationDemoSection } from "@/components/landing/verification-demo";
import { ArchitectureSection } from "@/components/landing/architecture";
import { StatsSection } from "@/components/landing/stats";
import { ScreenshotsSection } from "@/components/landing/screenshots";
import { TechStackSection } from "@/components/landing/tech-stack";
import { CTASection } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <VerificationDemoSection />
        <ArchitectureSection />
        <StatsSection />
        <ScreenshotsSection />
        <TechStackSection />
        <CTASection />
      </main>
      <LandingFooter />
    </>
  );
}