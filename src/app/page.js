import Navbar from "../components/Navbar";
import HeroBooking from "../components/HeroBooking";
import Destinations from "../components/Destinations";
import WhyUs from "../components/WhyUs";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="bg-[#07110f] text-white min-h-screen">
      <Navbar />
      <section id="hero">
        <HeroBooking />
      </section>
      <section id="destinations" className="py-16 px-6">
        <Destinations />
      </section>
      <section id="whyus" className="py-16 px-6">
        <WhyUs />
      </section>
      <section id="faq" className="py-16 px-6">
        <FAQ />
      </section>
      <Footer />
    </main>
  );
}