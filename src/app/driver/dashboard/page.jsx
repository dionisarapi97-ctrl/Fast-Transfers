"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DriverDashboard() {
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // stores booking ID currently updating

  useEffect(() => {
    async function loadDriverData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Fetch driver info matching email
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();

      if (driverError) {
        console.error("Error fetching driver:", driverError.message);
      }

      if (!driverData) {
        // Not a driver, redirect to client dashboard
        router.push("/client/dashboard");
        return;
      }

      setDriver(driverData);

      // Fetch bookings assigned to this driver
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("driver_id", driverData.id)
        .order("travel_date", { ascending: false })
        .order("travel_time", { ascending: false });

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError.message);
      } else {
        setBookings(bookingsData || []);
      }

      setLoading(false);
    }

    loadDriverData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const markAsCompleted = async (bookingId) => {
    setIsUpdating(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "Completed" })
      .eq("id", bookingId);

    setIsUpdating(null);

    if (error) {
      alert("Error: " + error.message);
    } else {
      // Update locally
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Completed" } : b))
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D084] mx-auto"></div>
          <p className="text-xs text-slate-450 uppercase font-bold tracking-widest mt-4">Duke ngarkuar profilin...</p>
        </div>
      </main>
    );
  }

  // Separate active/upcoming rides from completed/cancelled
  const activeBookings = bookings.filter(b => b.status === "Pending" || b.status === "Confirmed");
  const completedBookings = bookings.filter(b => b.status === "Completed" || b.status === "Cancelled");

  return (
    <main className="min-h-screen bg-[#07110f] text-white px-6 py-28 md:px-12">
      
      {/* Header bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D084]">Driver Dashboard</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Active Driver
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">{driver.name}</h1>
          <p className="text-xs text-slate-400 font-medium">
            🚗 {driver.car} ({driver.plate || "Fast Transfers"}) | 📞 {driver.phone}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer self-start md:self-center"
        >
          Dil nga Llogaria (Logout)
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 items-start">
        
        {/* Active Rides Section */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>📅</span> Udhëtimet Aktive / Në Pritje ({activeBookings.length})
          </h2>

          <div className="space-y-4">
            {activeBookings.map((b) => {
              const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(b.pickup)}&destination=${encodeURIComponent(b.dropoff)}&travelmode=driving`;
              const pickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.pickup)}`;
              const dropoffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.dropoff)}`;

              return (
                <div key={b.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5 hover:border-[#00D084]/30 transition duration-300 shadow-sm">
                  
                  {/* Row 1: Booking code & status */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        {b.booking_id}
                      </span>
                      <h3 className="text-base font-bold mt-2">{b.customer_name || "Client"}</h3>
                      <a href={`tel:${b.customer_phone}`} className="text-xs text-emerald-400 hover:underline block mt-1">
                        📞 {b.customer_phone}
                      </a>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                      {b.status}
                    </span>
                  </div>

                  {/* Row 2: Route details */}
                  <div className="grid gap-2 border-t border-white/5 pt-4 text-xs text-slate-300">
                    <p className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">🟢</span>
                      <span className="font-semibold text-white">Pickup Address:</span> {b.pickup}
                    </p>
                    {b.pickup_details && (
                      <p className="text-[11px] text-slate-450 pl-6 italic">Memo: {b.pickup_details}</p>
                    )}
                    
                    <p className="flex items-start gap-2 mt-2">
                      <span className="text-red-500 mt-0.5">🔴</span>
                      <span className="font-semibold text-white">Drop-off Destination:</span> {b.dropoff}
                    </p>
                    {b.dropoff_details && (
                      <p className="text-[11px] text-slate-455 pl-6 italic">Memo: {b.dropoff_details}</p>
                    )}

                    {b.flight_number && (
                      <p className="pl-6 text-[11px] text-sky-400 mt-1">🛫 Flight No: {b.flight_number}</p>
                    )}
                    {b.hotel_name && (
                      <p className="pl-6 text-[11px] text-white/50 mt-0.5">🏨 Hotel: {b.hotel_name}</p>
                    )}
                  </div>

                  {/* Row 3: Meta details */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase block font-bold">Data & Ora</span>
                      <span className="font-bold text-slate-200 mt-0.5 block">{b.travel_date} · {b.travel_time}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase block font-bold">Pagesa</span>
                      <span className="font-extrabold text-[#00D084] mt-0.5 block text-sm">{b.price} €</span>
                    </div>
                  </div>

                  {/* Row 4: Google Maps buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <a
                      href={pickupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-[10px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      📍 Pickup Map
                    </a>
                    <a
                      href={dropoffUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-[10px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      📍 Drop-off Map
                    </a>
                    <a
                      href={routeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[#00D084]/20 bg-[#00D084]/5 py-2.5 text-center text-[10px] font-bold text-emerald-400 hover:bg-[#00D084]/15 hover:text-emerald-300 transition"
                    >
                      🗺️ Navigation
                    </a>
                  </div>

                  {/* Row 5: Action Button */}
                  <button
                    onClick={() => markAsCompleted(b.id)}
                    disabled={isUpdating === b.id}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3.5 text-xs tracking-wider uppercase transition cursor-pointer shadow-sm"
                  >
                    {isUpdating === b.id ? "Duke përditësuar..." : "Përfundo Udhëtimin (Mark Completed)"}
                  </button>

                </div>
              );
            })}

            {activeBookings.length === 0 && (
              <div className="text-center py-16 text-slate-450 border border-white/10 bg-white/5 rounded-3xl p-6">
                <span className="text-3xl block mb-2">🚖</span>
                Nuk ka asnjë rezervim aktiv të caktuar aktualisht.
              </div>
            )}
          </div>
        </div>

        {/* History Rides Section */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>✓</span> Historiku i Udhëtimeve ({completedBookings.length})
          </h2>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {completedBookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-white/5 bg-white/5 p-5 text-xs space-y-3 opacity-70 hover:opacity-100 transition duration-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white/50">{b.booking_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    b.status === "Completed" 
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                      : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-200">{b.customer_name}</h4>
                <p className="text-slate-400 truncate"><span className="text-white/30">Rruga:</span> {b.pickup} ➔ {b.dropoff}</p>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 text-slate-450">
                  <span>📅 {b.travel_date} · {b.travel_time}</span>
                  <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded">{b.price} €</span>
                </div>
              </div>
            ))}

            {completedBookings.length === 0 && (
              <div className="text-center py-10 text-slate-500 border border-white/5 bg-white/5 rounded-2xl">
                Asnjë udhëtim i kryer ende.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
