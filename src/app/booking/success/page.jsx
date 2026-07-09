"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const WHATSAPP_NUMBER = "355693048000";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (error) {
        console.error(error);
        setIsLoading(false);
        return;
      }

      setBooking(data);
      setIsLoading(false);
    }

    fetchBooking();
  }, [bookingId]);

  function openWhatsApp() {
    if (!booking) return;

    const message = `🚖 FAST TRANSERS

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
      <div className="flex min-h-screen items-center justify-center bg-[#07110f] text-white">
        Loading booking...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07110f] px-6 text-white">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-black">Booking not found</h1>
          <Link href="/" className="mt-6 inline-block text-[#00D084]">
            Back to home
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

        <h1 className="mt-3 text-4xl font-black">Booking Confirmed</h1>

        <p className="mt-3 text-white/60">
          Your booking has been received and is pending confirmation.
        </p>
      </div>

      <div className="rounded-3xl border border-white/15 bg-black/20 p-6">
        <p className="text-sm text-white/50">Booking ID</p>
        <p className="mt-1 text-2xl font-black text-[#00D084]">
          {booking.booking_id}
        </p>

        <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          <Info label="Pickup" value={booking.pickup} />
          <Info label="Drop-off" value={booking.dropoff} />
          <Info label="Date" value={booking.travel_date} />
          <Info label="Time" value={booking.travel_time} />
          <Info label="Passengers" value={booking.passengers} />
          <Info label="Luggage" value={booking.luggage} />
          <Info
            label="Distance"
            value={
              booking.distance
                ? `${Number(booking.distance).toFixed(1)} km`
                : "-"
            }
          />
          <Info label="Duration" value={booking.duration} />
        </div>

        <div className="mt-6 rounded-2xl bg-[#00D084]/15 p-5">
          <p className="text-sm text-white/70">Total price</p>
          <p className="mt-1 text-4xl font-black text-[#00D084]">
            {booking.price} €
          </p>
        </div>

        <p className="mt-5 rounded-full border border-yellow-400/40 bg-yellow-500/10 px-4 py-3 text-center text-sm font-bold text-yellow-300">
          Status: {booking.status || "Pending"}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <Link
          href="/"
          className="flex-1 rounded-full border border-white/20 px-6 py-4 text-center text-sm font-bold hover:border-[#00D084] hover:text-[#00D084]"
        >
          Back Home
        </Link>

        <button
          onClick={() => window.location.reload()}
          className="flex-1 rounded-full border border-white/20 px-6 py-4 text-center text-sm font-bold hover:border-[#00D084] hover:text-[#00D084]"
        >
          Refresh Page
        </button>

        <button
          onClick={openWhatsApp}
          className="flex-1 rounded-full bg-[#00D084] px-6 py-4 text-sm font-bold text-white hover:scale-105"
        >
          WhatsApp
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
    <div>
      <p className="text-white/50">{label}</p>
      <p className="mt-1 font-semibold text-white">{value || "-"}</p>
    </div>
  );
}