"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

const WHATSAPP_NUMBER = "355693048000";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const { t, language } = useLanguage();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If there is no search query in the browser address bar at all, stop loading immediately
    if (typeof window !== "undefined" && !window.location.search) {
      setIsLoading(false);
      return;
    }

    if (!bookingId) return; // Wait for Next.js to parse the ID from the URL

    async function fetchBooking() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (error) {
        console.error("Error fetching booking details:", error.message);
        setBooking(null);
      } else {
        setBooking(data);
      }
      setIsLoading(false);
    }

    fetchBooking();
  }, [bookingId]);

  function openWhatsApp() {
    if (!booking) return;

    const message = `🚖 FAST TRANSFERS

Booking ID: ${booking.booking_id}

Pickup:
${booking.pickup}

Drop-off:
${booking.dropoff}

Date: ${booking.travel_date}
Time: ${booking.travel_time}

Passengers: ${booking.passengers}
Luggage: ${booking.luggage}

Price: ${booking.price} €`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07110f] text-white text-sm font-semibold">
        {t("loading_booking")}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07110f] px-6 text-white">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center max-w-sm w-full">
          <h1 className="text-2xl font-black">{t("booking_not_found")}</h1>
          <Link href="/" className="mt-6 inline-block text-[#00D084] font-bold text-sm hover:underline">
            {t("back_home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[36px] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#00D084]/20 text-4xl">
          ✅
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00D084]">
          Fast Transfers
        </p>

        <h1 className="mt-3 text-3xl font-black">
          {language === "sq" ? "Rezervimi u Konfirmua" : "Booking Confirmed"}
        </h1>

        <p className="mt-3 text-white/60 text-sm">
          {language === "sq" 
            ? "Rezervimi juaj u mor dhe është në pritje të konfirmimit të shpejtë." 
            : "Your booking has been received and is pending confirmation."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/15 bg-black/20 p-6">
        <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Booking ID</p>
        <p className="mt-1 text-2xl font-black text-[#00D084]">
          {booking.booking_id}
        </p>

        <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          <Info label={t("pickup_location")} value={booking.pickup} />
          <Info label={t("dropoff_destination")} value={booking.dropoff} />
          <Info label={t("travel_date")} value={booking.travel_date} />
          <Info label={t("travel_time")} value={booking.travel_time} />
          <Info label={t("passengers")} value={booking.passengers} />
          <Info label={t("luggage")} value={booking.luggage} />
          <Info
            label={t("summary_distance")}
            value={
              booking.distance
                ? `${Number(booking.distance).toFixed(1)} km`
                : "-"
            }
          />
          <Info label={t("summary_duration")} value={booking.duration} />
        </div>

        <div className="mt-6 rounded-2xl bg-[#00D084]/15 p-5">
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">{t("summary_price")}</p>
          <p className="mt-1 text-4xl font-black text-[#00D084]">
            {booking.price} €
          </p>
        </div>

        <p className="mt-5 rounded-full border border-yellow-450/40 bg-yellow-500/10 px-4 py-3 text-center text-sm font-bold text-yellow-300">
          {language === "sq" ? "Statusi" : "Status"}: {booking.status || "Pending"}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <Link
          href="/"
          className="flex-1 rounded-full border border-white/20 px-6 py-4 text-center text-sm font-bold hover:border-[#00D084] hover:text-[#00D084] transition"
        >
          {t("back_home")}
        </Link>

        <button
          onClick={() => window.location.reload()}
          className="flex-1 rounded-full border border-white/20 px-6 py-4 text-center text-sm font-bold hover:border-[#00D084] hover:text-[#00D084] transition cursor-pointer"
        >
          {language === "sq" ? "Rifresko Faqen" : "Refresh Page"}
        </button>

        <button
          onClick={openWhatsApp}
          className="flex-1 rounded-full bg-[#00D084] px-6 py-4 text-sm font-bold text-white hover:scale-105 transition cursor-pointer"
        >
          {t("confirm_whatsapp")}
        </button>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#07110f] px-6 py-16 text-white">
      <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
        <BookingSuccessContent />
      </Suspense>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4.5">
      <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-bold text-white text-sm">{value || "-"}</p>
    </div>
  );
}