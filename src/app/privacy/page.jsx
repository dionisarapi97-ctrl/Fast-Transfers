"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { language } = useLanguage();

  const isSq = language === "sq";

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex flex-col justify-between">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-36 pb-20 md:pt-44 space-y-8 leading-relaxed">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
          {isSq ? "Politika e Privatësisë" : "Privacy Policy"}
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
          {isSq ? "Përditësuar së fundmi: 13 Korrik 2026" : "Last Updated: July 13, 2026"}
        </p>

        <div className="space-y-6 text-sm text-slate-300 border-t border-slate-900 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🔒</span> {isSq ? "1. Siguria e të Dhënave" : "1. Data Security"}
            </h2>
            <p>
              {isSq 
                ? "Ne vlerësojmë jashtëzakonisht shumë privatësinë tuaj. Të gjitha të dhënat e rezervimit (Emri, Telefoni, Email-i, Adresat e Nisjes/Mbërritjes dhe Numri i Fluturimit) ruhen në mënyrë të sigurt në databazën tonë dhe shërbejnë vetëm për koordinimin dhe kryerjen e shërbimit të transportit."
                : "We value your privacy. All booking information (Name, Phone number, Email, Pickup/Drop-off addresses, and Flight Number) is securely stored in our encrypted database and is used solely for coordinating and executing your transfer service."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🤝</span> {isSq ? "2. Ndarja e të Dhënave" : "2. Information Sharing"}
            </h2>
            <p>
              {isSq
                ? "Të dhënat tuaja nuk shiten, nuk shkëmbehen dhe nuk u ndahen kurrë palëve të treta për qëllime marketingu. Ato janë të aksesueshme vetëm nga administratori i platformës Fast Transfers dhe nga shoferi i caktuar për kryerjen e rrugës suaj."
                : "Your personal data is never sold, leased, or shared with third parties for marketing purposes. It is only accessible to the administrator of the Fast Transfers platform and the designated driver assigned to your specific transfer."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🛡️</span> {isSq ? "3. Mbrojtja e Konsumatorit" : "3. Consumer Protection Rights"}
            </h2>
            <p>
              {isSq
                ? "Në përputhje me legjislacionin në fuqi për mbrojtjen e të dhënave personale, ju keni të drejtë të kërkoni në çdo kohë fshirjen e plotë të të dhënave tuaja personale dhe historikut të rezervimeve nga sistemet tona duke dërguar një email te: fasttransfers.booking@gmail.com."
                : "In compliance with personal data protection regulations, you have the right to request the complete deletion of your personal details and booking history from our servers at any time by emailing us at: fasttransfers.booking@gmail.com."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🍪</span> {isSq ? "4. Cookies dhe Ndjekja" : "4. Cookies and Tracking"}
            </h2>
            <p>
              {isSq
                ? "Faqja jonë përdor koka kodi minimale (si Google Analytics / Google Tag) për të parë statistikat e vizitave dhe për të përmirësuar ecurinë e reklamave tona, pa mbledhur informacione që identifikojnë identitetin tuaj privat."
                : "Our website uses minimal cookie trackers (such as Google Analytics / Google Tag) to measure traffic and optimize advertising campaigns, without collecting any personally identifying information."}
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
