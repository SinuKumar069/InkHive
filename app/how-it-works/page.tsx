"use client";

import { Header } from "@/components/header";
import HowitWorks from "@/components/how-it-work-section";
import FooterSection from "@/components/footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mt-24">
        <HowitWorks />
      </main>
      <FooterSection />
    </div>
  );
}
