"use client";

import { useState, useMemo } from "react";
import { fixedFares } from "../data/fares";
import { useLanguage } from "@/context/LanguageContext";

const destinationImages = {
  "Tirana Center": "/images/tirana.png",
  "Durrës": "/images/durres.png",
  "Golem": "/images/golem.png",
  "Vlorë": "/images/vlore.png",
  "Sarandë": "/images/saranda.png",
  "Shkodër": "/images/shkoder.png",
  "Berat": "/images/berat.png",
  "Gjirokastër": "/images/gjirokaster.jpg",
  "Korçë": "/images/korce.png",
  "Krujë": "/images/kruje.png",
};

const destinationDetails = {
  "Tirana Center": "Skanderbeg Square & Clock Tower",
  "Durrës": "Seafront Promenade & Amphitheatre",
  "Golem": "Sandy Beach Resorts & Pines",
  "Vlorë": "Llogara Pass & Lungomare Coast",
  "Sarandë": "Lekursi Castle & Ksamil Bay",
  "Shkodër": "Historic Pedestrian Street (Pedonale)",
  "Berat": "Mangalem Old Town (1000 Windows)",
  "Gjirokastër": "UNESCO Stone Castle & Old Bazaar",
  "Korçë": "Resurrection Cathedral & Pedestrian Street",
  "Krujë": "Skanderbeg Castle & Old Bazaar",
};

const popularDestinations = [
  "Tirana Center", "Durrës", "Golem", "Vlorë", "Sarandë", "Ksamil", "Shkodër", "Berat", "Krujë"
];

export default function Destinations() {
  const [search, setSearch] = useState("");
  const { t, language } = useLanguage();

  const handleSelectRoute = (fare) => {
    const pickupLocation = "Tirana International Airport Nënë Tereza (TIA), Rinas, Albania";
    const dropoffLocation = fare.to + ", Albania";

    window.dispatchEvent(
      new CustomEvent("autofill-booking", {
        detail: {
          pickup: pickupLocation,
          dropoff: dropoffLocation,
        },
      })
    );

    const bookingCard = document.getElementById("booking-card");
    if (bookingCard) {
      bookingCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const popularFares = useMemo(() => {
    return fixedFares.filter(fare => popularDestinations.includes(fare.to));
  }, []);

  const searchedResults = useMemo(() => {
    if (!search.trim()) return [];
    return fixedFares.filter(fare =>
      fare.to.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
          {t("dest_title")}
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 leading-tight">
          {t("dest_sub")}
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          {t("dest_desc")}
        </p>
      </div>

      {/* Grid: Popular Destinations */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {popularFares.map((fare, idx) => (
          <div
            key={idx}
            className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/25 p-5 transition-all duration-300 hover:border-emerald-500/25 hover:-translate-y-1.5 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            <div>
              {/* Destination Image */}
              <div className="relative h-44 w-full overflow-hidden rounded-2xl mb-5 border border-slate-800/40">
                <img
                  src={destinationImages[fare.to] || "https://images.unsplash.com/photo-1540206395-68808572332f?auto=format&fit=crop&w=600&q=80"}
                  alt={fare.to}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <span className="absolute bottom-3 left-3 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-450">
                  {t("fixed_from_tia")}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4 mb-1.5">
                <h3 className="text-xl font-extrabold text-slate-200 group-hover:text-emerald-400 transition duration-200">
                  {fare.to}
                </h3>
                <span className="text-2xl font-black text-emerald-400 tracking-tight whitespace-nowrap">
                  {fare.price} €
                </span>
              </div>

              <p className="text-xs text-emerald-500 font-bold tracking-wide mb-3">
                {destinationDetails[fare.to] || `${fare.distanceKm} km`}
              </p>

              <p className="text-xs text-slate-400 leading-relaxed">
                {t("direct_private_desc")}
              </p>

              <div className="mt-6 space-y-2.5 border-t border-slate-800/60 pt-4 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>{t("distance_price")}:</span>
                  <span className="text-slate-200 font-medium">{fare.distanceKm} km · {fare.priceLek.toLocaleString()} Lek</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("child_seat_option")}:</span>
                  <span className="text-slate-200 font-medium">+10 € ({language === "sq" ? "Opsionale" : "Optional"})</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectRoute(fare)}
              className="mt-6 w-full rounded-2xl bg-slate-950/40 py-3 text-xs font-bold text-slate-300 transition-all duration-200 border border-slate-800/60 group-hover:bg-[#10b981] group-hover:text-black group-hover:border-transparent group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
            >
              {t("book_this_route")}
            </button>
          </div>
        ))}
      </div>

      {/* Lookup / Search engine for all 60+ destinations */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/10 p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md">
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-bold text-slate-100">
            {t("check_other_cities")}
          </h3>
          <p className="text-xs text-slate-450">
            {t("enter_dest_desc")}
          </p>
        </div>

        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_city_placeholder")}
            className="w-full rounded-xl border border-slate-800/85 bg-slate-950/45 pl-10 pr-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-650 focus:border-emerald-500/50 focus:bg-slate-950/65 transition"
          />
        </div>

        {/* Searched Results Output */}
        {search.trim() ? (
          <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/15 divide-y divide-slate-900">
            {searchedResults.length > 0 ? (
              searchedResults.map((result, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{result.to}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {language === "sq" ? "Distanca nga TIA:" : "Distance from TIA:"} <span className="text-slate-350">{result.distanceKm} km</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4.5 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">{result.price} €</p>
                      <p className="text-[10px] text-slate-500">{result.priceLek.toLocaleString()} Lek</p>
                    </div>
                    
                    <button
                      onClick={() => handleSelectRoute(result)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 text-[10px] transition cursor-pointer"
                    >
                      {t("book_ride")}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                {t("no_dest_found")}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-850/40 bg-slate-950/10 p-4 text-[11px] text-slate-500 text-center">
            {language === "sq" 
              ? "Shkruani qytetin tuaj në shiritin e kërkimit më sipër për të parë tarifat fikse për të gjithë Shqipërinë, Kosovën dhe Malin e Zi."
              : "Type your city in the search bar above to look up fixed rates for all of Albania, Kosovo, and Montenegro."
            }
          </div>
        )}
      </div>

    </div>
  );
}
