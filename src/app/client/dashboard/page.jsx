"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

const languages = [
  { code: "sq", label: "Shqip", flag: "🇦🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function ClientDashboard() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Review states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedBookingToReview, setSelectedBookingToReview] = useState(null);
  const [ratingWebsite, setRatingWebsite] = useState(5);
  const [ratingDriver, setRatingDriver] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
        name: session.user.user_metadata?.full_name || (language === "sq" ? "Klient Besnik" : "Loyal Client"),
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

    // Click outside dropdown handler
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router, language]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const openReviewModal = (booking) => {
    setSelectedBookingToReview(booking);
    setRatingWebsite(5);
    setRatingDriver(5);
    setReviewComment("");
    setIsReviewOpen(true);
  };

  const submitReview = async () => {
    if (!selectedBookingToReview) return;
    setSubmittingReview(true);

    const updateData = {
      rating_website: ratingWebsite,
      review_comment: reviewComment,
    };

    if (selectedBookingToReview.driver_name) {
      updateData.rating_driver = ratingDriver;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", selectedBookingToReview.id);

    setSubmittingReview(false);

    if (error) {
      alert(t("review_error") + ": " + error.message);
      return;
    }

    alert(t("review_success"));
    
    // Update local state directly so the yjet show up without reloading!
    setBookings(prev => prev.map(b => b.id === selectedBookingToReview.id ? { ...b, ...updateData } : b));
    setIsReviewOpen(false);
    setSelectedBookingToReview(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07110f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D084] mx-auto"></div>
          <p className="text-xs text-slate-455 uppercase font-bold tracking-widest mt-4">{t("loading_profile")}</p>
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

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <main className="min-h-screen bg-[#07110f] text-white px-6 py-28 md:px-12 relative">
      
      {/* Floating Language Switcher Top-Right */}
      <div className="absolute top-6 right-6" ref={dropdownRef}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition duration-200 cursor-pointer"
        >
          <span>{currentLang.flag}</span>
          <span className="uppercase text-[10px] tracking-wide">{currentLang.code}</span>
          <span className="text-[8px] opacity-60">▼</span>
        </button>
        
        {langOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/15 bg-slate-950 p-1.5 shadow-2xl z-50 space-y-0.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setLangOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold transition hover:bg-white/10 cursor-pointer ${
                  language === l.code ? "text-[#00D084] bg-white/5" : "text-slate-350"
                }`}
              >
                <span className="text-sm">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D084]">{t("client_dashboard_title")}</span>
            <span className="text-[10px] text-emerald-455 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              {t("loyal_client")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">
            {t("welcome_client", { name: profile.name })}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            📧 {profile.email} | 📞 {profile.phone}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={() => router.push("/booking")}
            className="rounded-full bg-[#00D084] hover:bg-[#00b06f] px-6 py-2.5 text-xs font-extrabold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,208,132,0.25)] cursor-pointer"
          >
            {t("book_new_transfer")} 🚖
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
          >
            {t("logout")}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 items-start">
        
        {/* Upcoming Transfers */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>📅</span> {t("upcoming_trips")} ({upcomingBookings.length})
          </h2>

          <div className="space-y-4">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-sm hover:border-[#00D084]/20 transition duration-300">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-455 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      {b.booking_id}
                    </span>
                    <div className="grid gap-1 mt-3 text-xs text-slate-350">
                      <p className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-500">🟢</span>
                        <span className="truncate"><strong>{t("summary_from")}:</strong> {b.pickup}</span>
                      </p>
                      {b.pickup_details && <p className="text-[10px] text-slate-450 pl-5 italic">({b.pickup_details})</p>}
                      
                      <p className="flex items-center gap-1.5 truncate mt-1">
                        <span className="text-red-500">🔴</span>
                        <span className="truncate"><strong>{t("summary_to")}:</strong> {b.dropoff}</span>
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
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">{t("summary_date")} &amp; {t("summary_time")}</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{b.travel_date} · {b.travel_time}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">{t("summary_passengers")}</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">👥 {b.passengers} pax</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">{t("summary_price")}</span>
                    <span className="font-extrabold text-[#00D084] mt-0.5 block">{b.price} €</span>
                  </div>
                </div>

                {b.driver_name && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-455 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                    <span>🚗</span>
                    <span>{t("assigned_driver")}: <strong>{b.driver_name}</strong></span>
                  </div>
                )}
              </div>
            ))}

            {upcomingBookings.length === 0 && (
              <div className="text-center py-16 text-slate-450 border border-white/10 bg-white/5 rounded-3xl p-6">
                <span className="text-3xl block mb-2">🚖</span>
                {t("no_upcoming_trips")}
              </div>
            )}
          </div>
        </div>

        {/* Past Transfers History */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2.5 border-b border-white/5 pb-2">
            <span>✓</span> {t("trip_history")} ({pastBookings.length})
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
                <p className="text-slate-355 truncate"><span className="text-white/30">{t("summary_from")}:</span> {b.pickup}</p>
                <p className="text-slate-355 truncate"><span className="text-white/30">{t("summary_to")}:</span> {b.dropoff}</p>
                
                {/* Driver name */}
                {b.status === "Completed" && b.driver_name && (
                  <p className="text-[10px] text-slate-400">🚗 {t("assigned_driver")}: <strong className="text-slate-300">{b.driver_name}</strong></p>
                )}

                {/* Ratings display or review button */}
                {b.status === "Completed" && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    {b.rating_website ? (
                      <div className="text-[10px] text-emerald-450 font-bold flex flex-wrap gap-2.5">
                        <span>🖥️ Service: {b.rating_website} ★</span>
                        {b.rating_driver && <span>🚗 Driver: {b.rating_driver} ★</span>}
                      </div>
                    ) : (
                      <button
                        onClick={() => openReviewModal(b)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 text-[10px] tracking-wide uppercase transition cursor-pointer"
                      >
                        {t("leave_review")} 💬
                      </button>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 text-slate-455">
                  <span>📅 {b.travel_date} · {b.travel_time}</span>
                  <span className="font-bold text-[#00D084]">{b.price} €</span>
                </div>
              </div>
            ))}

            {pastBookings.length === 0 && (
              <div className="text-center py-10 text-slate-550 border border-white/5 bg-white/5 rounded-2xl">
                {t("no_past_trips")}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Modal Dialog Overlay */}
      {isReviewOpen && selectedBookingToReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950 p-6 md:p-8 space-y-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setIsReviewOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            
            <div className="text-center space-y-2">
              <span className="text-3xl">⭐</span>
              <h3 className="text-xl font-black text-slate-100">{t("review_title")}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Booking ID: {selectedBookingToReview.booking_id}
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Star Rating Website */}
              <div className="space-y-2 text-center">
                <label className="text-xs font-semibold text-slate-450 block">{t("rate_service")}</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingWebsite(star)}
                      className={`text-2xl cursor-pointer transition ${
                        star <= ratingWebsite ? "text-amber-400 scale-110" : "text-white/20 hover:text-white/40"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating Driver (if driver is assigned) */}
              {selectedBookingToReview.driver_name && (
                <div className="space-y-2 border-t border-white/5 pt-3 text-center">
                  <label className="text-xs font-semibold text-slate-450 block">
                    {t("rate_driver", { name: selectedBookingToReview.driver_name })}
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingDriver(star)}
                        className={`text-2xl cursor-pointer transition ${
                          star <= ratingDriver ? "text-amber-400 scale-110" : "text-white/20 hover:text-white/40"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Comments */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <label className="text-xs font-semibold text-slate-450 block">
                  {language === "sq" ? "Komentet tuaja (opsionale):" : "Your comments (optional):"}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t("review_placeholder")}
                  rows="3"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-xs text-white outline-none focus:border-[#00D084] focus:bg-white/10 transition resize-none placeholder:text-white/20"
                />
              </div>

              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="w-full rounded-full bg-[#00D084] hover:bg-[#00b06f] disabled:opacity-50 text-white font-extrabold py-3.5 text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_20px_rgba(0,208,132,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-4"
              >
                {submittingReview ? t("submitting") : t("submit_review")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
