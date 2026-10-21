import Navbar from "@/components/Navbar";
import FloatingActions from "@/components/FloatingActions";
import Hero from "@/components/sections/Hero";
import Benefits from "@/components/sections/Benefits";
import Ambiente from "@/components/sections/Ambiente";
import Services from "@/components/sections/Services";
import QRWhatsApp from "@/components/sections/QRWhatsApp";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import ConsultorChat from "@/components/ConsultorChat";
import AgendarModal from "@/components/AgendarModal";
import { useEffect } from "react";
import { trackVisit, startNavigationTracking } from "@/lib/analytics";

export default function Home() {
  useEffect(() => {
    trackVisit("/");
  }, []);
  useEffect(() => startNavigationTracking(), []);
  return (
    <div className="bg-[#0A0A0B] min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Benefits />
        <Ambiente />
        <Services />
        <QRWhatsApp />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
      <ConsultorChat />
      <AgendarModal />
    </div>
  );
}