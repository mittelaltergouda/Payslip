import type { Metadata } from "next";
import { SeoIntro } from "@/components/SeoIntro";
import { SessionWizard } from "@/components/SessionWizard";
import { siteMetadata } from "@/lib/seo";

export const metadata: Metadata = siteMetadata;

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <SeoIntro />
      <SessionWizard />
    </main>
  );
}
