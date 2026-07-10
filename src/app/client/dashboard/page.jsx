"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      setProfile({
        email: session.user.email,
        name: session.user.user_metadata?.full_name || "Klient Besnik",
        phone: session.user.user_metadata?.phone || "-",
      });

      // Fetch bookings linked to this client email
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_email", session.user.email)
        .order("travel_date", { ascending: false })
        .order("travel_time", { ascending: false });

      if (bookingsError) {
        console.error("Error fetching client bookings:", bookingsError.message);
      } else {
        setBookings(bookingsData || []);
      }

      setLoading(false);
    }

    loadClientData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D084] mx-auto"></div>
          <p className="text-xs text-slate-455 uppercase font-bold tracking-widest mt-4">Duke ngarkuar profilin...</p>
        </div>
      </main>
    );
  }

  // Separate upcoming and past bookings
  const nowStr = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.filter(b => {
    if (b.status === "Cancelled" || b.status === "Completed") return false;
    return b.travel_date >= nowStr;
  });
  
  const pastBookings = bookings.filter(b => {
    if (b.status === "Cancelled" || b.status === "Completed") return true;
    return b.travel_date < nowStr;
  });

  return (
    <main className="min-h-screen bg-[#07110f] text-white px-6 py-28 md:px-12">
      
      {/* Header Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D084]">Client Dashboard</span>
            <span className="text-[10px] text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Klient Besnik (Loyal Client)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">Mirësevini, {profile.name}!</h1>
          <p className="text-xs text-slate-400 font-medium">
            📧 {profile.email} | 📞 {profile.phone}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={() => router.push("/booking")}
            className="rounded-full bg-[#00D084] hover:bg-[#00b06f] px-6 py-2.5 text-xs font-extrabold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,208,132,0.25)] cursor-pointer"
          >
            Rezervo Transfertë të Re 🚖
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
          >
            Dil (Logout)
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 items-start">
        
        {/* Upcoming Transfers */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>📅</span> Udhëtimet e Ardhshme ({upcomingBookings.length})
          </h2>

          <div className="space-y-4">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-sm hover:border-[#00D084]/20 transition duration-300">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      {b.booking_id}
                    </span>
                    <div className="grid gap-1 mt-3 text-xs text-slate-350">
                      <p className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-500">🟢</span>
                        <span className="truncate"><strong>Nga:</strong> {b.pickup}</span>
                      </p>
                      {b.pickup_details && <p className="text-[10px] text-slate-450 pl-5 italic">({b.pickup_details})</p>}
                      
                      <p className="flex items-center gap-1.5 truncate mt-1">
                        <span className="text-red-500">🔴</span>
                        <span className="truncate"><strong>Tek:</strong> {b.dropoff}</span>
                      </p>
                      {b.dropoff_details && <p className="text-[10px] text-slate-450 pl-5 italic">({b.dropoff_details})</p>}
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    {b.status || "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-black/20 p-4 rounded-2xl border border-white/5 pt-3">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">Data & Ora</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{b.travel_date} · {b.travel_time}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">Udhëtarë</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">👥 {b.passengers} pax</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">Çmimi</span>
                    <span className="font-extrabold text-[#00D084] mt-0.5 block">{b.price} €</span>
                  </div>
                </div>

                {b.driver_name && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                    <span>🚗</span>
                    <span>Shoferi i caktuar: <strong>{b.driver_name}</strong></span>
                  </div>
                )}
              </div>
            ))}

            {upcomingBookings.length === 0 && (
              <div className="text-center py-16 text-slate-450 border border-white/10 bg-white/5 rounded-3xl p-6">
                <span className="text-3xl block mb-2">🚖</span>
                Nuk keni asnjë udhëtim të planifikuar.
              </div>
            )}
          </div>
        </div>

        {/* Past Transfers History */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>✓</span> Historiku i Udhëtimeve ({pastBookings.length})
          </h2>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {pastBookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-white/5 bg-white/5 p-5 text-xs space-y-3 opacity-75 hover:opacity-100 transition duration-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white/50">{b.booking_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    b.status === "Completed" 
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                      : b.status === "Cancelled"
                      ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                      : "text-slate-400 bg-slate-500/10 border border-slate-500/20"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-slate-350 truncate"><span className="text-white/30">Nga:</span> {b.pickup}</p>
                <p className="text-slate-350 truncate"><span className="text-white/30">Tek:</span> {b.dropoff}</p>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 text-slate-450">
                  <span>📅 {b.travel_date} · {b.travel_time}</span>
                  <span className="font-bold text-[#00D084]">{b.price} €</span>
                </div>
              </div>
            ))}

            {pastBookings.length === 0 && (
              <div className="text-center py-10 text-slate-550 border border-white/5 bg-white/5 rounded-2xl">
                Asnjë udhëtim i shkuar.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
