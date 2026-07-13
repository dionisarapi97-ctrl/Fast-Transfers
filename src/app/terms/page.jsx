"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { language } = useLanguage();

  const isSq = language === "sq";

  return (
    <main className="min-h-screen bg-[#07110f] text-white flex flex-col justify-between">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-36 pb-20 md:pt-44 space-y-8 leading-relaxed">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
          {isSq ? "Kushtet e Shërbimit & Mbrojtja e Klientit" : "Terms of Service & Client Protection"}
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
          {isSq ? "Përditësuar së fundmi: 13 Korrik 2026" : "Last Updated: July 13, 2026"}
        </p>

        <div className="space-y-6 text-sm text-slate-300 border-t border-slate-900 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>💳</span> {isSq ? "1. Çmimet Fikse & Transparenca" : "1. Fixed Prices & Transparency"}
            </h2>
            <p>
              {isSq 
                ? "Të gjitha çmimet e shfaqura gjatë rezervimit janë përfundimtare dhe fikse. Ato përfshijnë të gjitha taksat rrugore (tolls), karburantin, kohën e pritjes, shoferin dhe bagazhet. Nuk ka asnjë tarifë të fshehur shtesë gjatë udhëtimit."
                : "All prices calculated and shown during the booking process are final and fixed. They include all highway tolls, fuel, waiting times, driver service, and luggage. There are no hidden fees or extra charges during your journey."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🔄</span> {isSq ? "2. Anullimi & Rimbursimi" : "2. Cancellations & Refund Policy"}
            </h2>
            <p>
              {isSq
                ? "Fast Transfers garanton mbrojtje të plotë për konsumatorin. Rezervimi juaj mund të anullohet plotësisht FALAS deri në 24 orë përpara kohës së planifikuar të nisjes. Nëse keni paguar paraprakisht, rimbursimi do të bëhet i plotë."
                : "Fast Transfers guarantees comprehensive consumer protection. Your booking can be cancelled completely FREE of charge up to 24 hours prior to the scheduled pickup time. Pre-paid bookings will receive a full 100% refund."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🛫</span> {isSq ? "3. Monitorimi i Fluturimit & Pritja Falas" : "3. Flight Monitoring & Free Waiting"}
            </h2>
            <p>
              {isSq
                ? "Për të gjitha marrjet nga Aeroporti i Rinasit (TIA), ne monitorojmë statusin e fluturimit tuaj në kohë reale. Nëse fluturimi juaj vonohet, shoferi juaj do të jetë aty duke ju pritur pa asnjë pagesë shtesë për kohën e pritjes."
                : "For all pickups at Tirana International Airport (TIA), we monitor your flight status in real-time. If your flight is delayed, your driver will adjust their arrival accordingly and wait for you at no extra waiting cost."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🚗</span> {isSq ? "4. Siguria e Automjetit & Licencimi" : "4. Vehicle Safety & Licensing"}
            </h2>
            <p>
              {isSq
                ? "Fast Transfers operon vetëm me automjete premium të mirëmbajtura, kryesisht 100% elektrike. Të gjithë shoferët tanë janë të pajisur me licencat përkatëse profesionale dhe automjetet tona janë plotësisht të siguruara për të garantuar udhëtimin tuaj të sigurt."
                : "Fast Transfers operates exclusively with premium-grade, well-maintained vehicles, primarily 100% electric. All our drivers hold active professional licenses, and all vehicles carry complete passenger insurance to guarantee a safe journey."}
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
