import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import BrandStory from "@/components/BrandStory";
import EmailSignup from "@/components/EmailSignup";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Nav />
      <Hero />
      <FeatureCards />
      <BrandStory />
      <EmailSignup />
      <Footer />
    </main>
  );
}
