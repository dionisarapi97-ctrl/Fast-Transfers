"use client";

export default function Navbar() {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBookNow = () => {
    const bookingCard = document.getElementById("booking-card");
    if (bookingCard) {
      bookingCard.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 flex h-[90px] w-full items-center justify-between px-6 md:px-12 backdrop-blur-xl bg-slate-950/45 border-b border-slate-900/85">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-wide text-slate-100 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Fast Transfers
        </h2>
        <p className="hidden sm:block text-xs text-emerald-500 font-medium">
          Travel Electric. Travel Premium.
        </p>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
        <button
          onClick={() => handleScrollTo("destinations")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          Destinations
        </button>
        <button
          onClick={() => handleScrollTo("whyus")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          Why Us
        </button>
        <button
          onClick={() => handleScrollTo("faq")}
          className="hover:text-slate-100 transition duration-200 cursor-pointer"
        >
          FAQ
        </button>
        <a
          href="tel:+355693048000"
          className="text-emerald-500 hover:text-emerald-400 transition duration-200 flex items-center gap-1.5"
        >
          📞 +355 69 304 8000
        </a>
      </div>

      <button
        onClick={handleBookNow}
        className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
      >
        Book Now
      </button>
    </nav>
  );
}