"use client";

import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative h-[calc(100vh-72px)] overflow-hidden">

      {/* Background */}
      <img
        src="/images/fast-transfers-hero.jpg"
        alt="Fast Transfers Airport Transfer"
        className="absolute inset-0 h-full w-full object-cover object-[20%_center]"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-black/15" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-20">
        <div className="max-w-xl">

          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[#00D084]">
            Albania Premium Electric Transfers
          </p>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] text-white">
            Premium airport
            <br />
            transfers across
            <br />
            Albania.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/85">
            Electric private transfers from Tirana International Airport to
            Tirana, Durrës, Golem and destinations across Albania.
          </p>

          {/* Features */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/90">

            <div className="flex items-center gap-2">
              <span className="text-[#00D084]">✔</span>
              Fixed Prices
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#00D084]">⚡</span>
              100% Electric Fleet
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#00D084]">🕒</span>
              24/7 Airport Transfers
            </div>

          </div>

          {/* Button */}
          <button
            onClick={() => router.push("/booking")}
            className="mt-10 rounded-full bg-[#00D084] px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,208,132,0.45)]"
          >
            Book Your Transfer
          </button>

        </div>
      </div>

    </section>
  );
}