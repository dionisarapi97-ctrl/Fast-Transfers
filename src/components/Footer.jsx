"use client";

export default function Footer() {
  const WHATSAPP_NUMBER = "355693048000";

  return (
    <footer className="border-t border-slate-900 bg-slate-950/45 text-slate-400 py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-12">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-5">
          <h3 className="text-xl font-black text-slate-100 tracking-wider">Fast Transfers</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Albania&apos;s premier 100% electric private airport transfer service. Travel clean, comfortable, and with fully transparent fixed rates.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 text-xs font-bold text-emerald-500">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition duration-200 flex items-center gap-1.5"
            >
              💬 WhatsApp Us
            </a>
            <a href="tel:+355693048000" className="hover:text-emerald-400 transition duration-200 flex items-center gap-1.5">
              📞 +355 69 304 8000
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-[0.2em]">Quick Links</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <a href="#hero" className="hover:text-white transition duration-200">Home</a>
            </li>
            <li>
              <a href="#destinations" className="hover:text-white transition duration-200">Destinations</a>
            </li>
            <li>
              <a href="#whyus" className="hover:text-white transition duration-200">Why Us</a>
            </li>
            <li>
              <a href="#faq" className="hover:text-white transition duration-200">FAQ</a>
            </li>
          </ul>
        </div>

        {/* Top Routes Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-[0.2em]">Top Routes</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li>Tirana Airport (TIA) → Tirana Center</li>
            <li>Tirana Airport (TIA) → Durrës / Golem</li>
            <li>Tirana Airport (TIA) → Vlorë</li>
            <li>Tirana Airport (TIA) → Sarandë / Ksamil</li>
          </ul>
        </div>

        {/* Location Info */}
        <div className="md:col-span-2 space-y-4 text-xs">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-[0.2em]">Location</h4>
          <p className="leading-relaxed text-slate-450">
            Tirana International Airport &quot;Nënë Tereza&quot;<br />
            Rinas, Albania
          </p>
          <p className="text-slate-400">
            Email: <a href="mailto:info@fast-transfers.al" className="hover:underline text-slate-350">info@fast-transfers.al</a>
          </p>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-14 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30">
        <p>&copy; {new Date().getFullYear()} Fast Transfers. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition">Terms &amp; Conditions</a>
          <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
