"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_WHATSAPP = "355693048000";

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [driverFilter, setDriverFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Note state
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  async function fetchData() {
    setLoading(true);

    const bookingsResult = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    const driversResult = await supabase
      .from("drivers")
      .select("*")
      .eq("status", "Active")
      .order("id", { ascending: true });

    if (bookingsResult.error) alert(bookingsResult.error.message);
    if (driversResult.error) alert(driversResult.error.message);

    const loadedBookings = bookingsResult.data || [];
    setBookings(loadedBookings);
    setDrivers(driversResult.data || []);
    
    // Keep selected booking reference updated if it exists
    if (selectedBooking) {
      const updatedSelected = loadedBookings.find(b => b.id === selectedBooking.id);
      if (updatedSelected) {
        setSelectedBooking(updatedSelected);
        setAdminNotes(updatedSelected.admin_notes || "");
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // 1. Search text filter
      const text = `${booking.booking_id} ${booking.customer_name || ""} ${booking.pickup} ${booking.dropoff} ${booking.driver_name || ""}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());

      // 2. Status filter
      const matchStatus = statusFilter === "All" || booking.status === statusFilter;

      // 3. Driver filter
      let matchDriver = true;
      if (driverFilter === "Unassigned") {
        matchDriver = !booking.driver_id;
      } else if (driverFilter === "Assigned") {
        matchDriver = !!booking.driver_id;
      } else if (driverFilter !== "All") {
        matchDriver = String(booking.driver_id) === String(driverFilter);
      }

      // 4. Date filter
      let matchDate = true;
      const getLocalDateStr = (offset = 0) => {
        const d = new Date();
        if (offset !== 0) d.setDate(d.getDate() + offset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      if (dateFilter === "Today") {
        matchDate = booking.travel_date === getLocalDateStr(0);
      } else if (dateFilter === "Tomorrow") {
        matchDate = booking.travel_date === getLocalDateStr(1);
      } else if (dateFilter === "Custom" && customDate) {
        matchDate = booking.travel_date === customDate;
      }

      return matchSearch && matchStatus && matchDriver && matchDate;
    });
  }, [bookings, search, statusFilter, driverFilter, dateFilter, customDate]);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.total_price || b.price || 0),
      0
    );

    const driverTotal = bookings.reduce(
      (sum, b) => sum + Number(b.driver_share || 0),
      0
    );

    const companyTotal = bookings.reduce(
      (sum, b) => sum + Number(b.company_share || 0),
      0
    );

    return {
      bookings: bookings.length,
      revenue: totalRevenue,
      driverTotal,
      companyTotal,
      pending: bookings.filter((b) => b.status === "Pending").length,
    };
  }, [bookings]);

  async function updateBooking(id, values) {
    const { error } = await supabase
      .from("bookings")
      .update(values)
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // Update local states directly for responsiveness
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...values } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => ({ ...prev, ...values }));
    }
  }

  async function saveNotes() {
    if (!selectedBooking) return;
    setIsSavingNotes(true);

    const { error } = await supabase
      .from("bookings")
      .update({ admin_notes: adminNotes })
      .eq("id", selectedBooking.id);

    setIsSavingNotes(false);

    if (error) {
      alert("Failed to save notes: " + error.message);
      return;
    }

    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, admin_notes: adminNotes } : b));
    setSelectedBooking(prev => ({ ...prev, admin_notes: adminNotes }));
    alert("Booking notes saved successfully!");
  }

  async function assignDriver(booking, driverId) {
    const driver = drivers.find((d) => String(d.id) === String(driverId));

    if (!driver) {
      await updateBooking(booking.id, {
        driver_id: null,
        driver_name: null,
        driver_share: null,
        company_share: null,
      });
      return;
    }

    const totalPrice = Number(booking.price || 0);
    let driverShare = 0;

    if (totalPrice >= 50) {
      driverShare = Math.round(totalPrice * 0.88);
    } else {
      driverShare = Math.round(totalPrice * 0.75);
    }

    const companyShare = totalPrice - driverShare;

    await updateBooking(booking.id, {
      driver_id: driver.id,
      driver_name: driver.name,
      total_price: totalPrice,
      driver_share: driverShare,
      company_share: companyShare,
    });
  }

  async function deleteBooking(id) {
    if (!confirm("Are you sure you want to delete this booking permanently?")) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(null);
    }
    
    setBookings(prev => prev.filter(b => b.id !== id));
  }

  function handleSelectBooking(booking) {
    setSelectedBooking(booking);
    setAdminNotes(booking.admin_notes || "");
  }

  function statusClass(status) {
    if (status === "Confirmed")
      return "border-emerald-250 bg-emerald-50 text-emerald-700";
    if (status === "Completed")
      return "border-blue-250 bg-blue-50 text-blue-700";
    if (status === "Cancelled")
      return "border-rose-250 bg-rose-50 text-rose-700";

    return "border-amber-250 bg-amber-50 text-amber-700";
  }

  function openMaps(booking) {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      booking.pickup || ""
    )}&destination=${encodeURIComponent(
      booking.dropoff || ""
    )}&travelmode=driving`;

    window.open(url, "_blank");
  }

  function openAdminWhatsApp(booking) {
    const message = buildWhatsAppMessage(booking);
    window.open(
      `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  function openDriverWhatsApp(booking) {
    const driver = drivers.find((d) => d.id === booking.driver_id);

    if (!driver?.phone) {
      alert("No phone number found for this driver.");
      return;
    }

    const phone = driver.phone.replace("+", "").replaceAll(" ", "");
    const message = buildWhatsAppMessage(booking);

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  function buildWhatsAppMessage(booking) {
    return `🚖 *FAST TRANSFERS - BOOKING DETAILS*
----------------------------------------
📌 *Booking ID:* ${booking.booking_id || "-"}
👤 *Customer:* ${booking.customer_name || "-"}
📞 *Phone:* ${booking.customer_phone || "-"}

📅 *Date:* ${booking.travel_date || "-"}
🕒 *Time:* ${booking.travel_time || "-"}

🛫 *Flight Number:* ${booking.flight_number || "None"}
🏨 *Hotel/Accommodation:* ${booking.hotel_name || "None"}

🟢 *Pickup Address:* ${booking.pickup || "-"}
📝 *Pickup Details:* ${booking.pickup_details || "None"}

🔴 *Drop-off Address:* ${booking.dropoff || "-"}
📝 *Drop-off Details:* ${booking.dropoff_details || "None"}

👥 *Passengers:* ${booking.passengers || "1"}
🧳 *Luggage:* ${booking.luggage || "0"}

📏 *Distance:* ${booking.distance ? `${Number(booking.distance).toFixed(1)} km` : "-"}
⏱ *Est. Duration:* ${booking.duration || "-"}

💶 *Total Fare:* ${booking.price || "-"} €
----------------------------------------
🚗 *Assigned Driver:* ${booking.driver_name || "None"}
💰 *Driver Payout:* ${booking.driver_share ? `${booking.driver_share} €` : "-"}
🏢 *Company Share:* ${booking.company_share ? `${booking.company_share} €` : "-"}

⚙️ *Status:* ${booking.status || "Pending"}
📝 *Admin Notes:* ${booking.admin_notes || "None"}
----------------------------------------`;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-800 md:px-12 relative">
      
      {/* Top Header Section */}
      <div className="relative z-10 mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              Fast Transfers Panel
            </p>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Live Operations
            </span>
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Operations Dashboard
          </h1>
        </div>

        <button
          onClick={fetchData}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat title="Total Bookings" value={stats.bookings} icon="📊" desc="All registered rides" />
        <Stat title="Gross Revenue" value={`${stats.revenue} €`} icon="💶" desc="Sum of all transfers" />
        <Stat title="Drivers share" value={`${stats.driverTotal} €`} icon="🚗" desc="Total payouts paid/due" />
        <Stat title="Platform earnings" value={`${stats.companyTotal} €`} icon="🏢" desc="Net commission share" />
        <Stat title="Action Needed" value={stats.pending} icon="⏳" desc="Pending assignments" highlight={stats.pending > 0} />
      </div>

      {/* Main Layout: Master-Detail Grid */}
      <div className="relative z-10 grid gap-6 lg:grid-cols-12 items-start">
        
        {/* LEFT COLUMN: Master Booking List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Search & Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Client Name, Booking ID, Route, Driver..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/40 transition"
              />
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-850 outline-none focus:bg-white focus:border-emerald-500/40 cursor-pointer transition"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Date Schedule</label>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-850 outline-none focus:bg-white focus:border-emerald-500/40 cursor-pointer transition"
                  >
                    <option value="All">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Custom">Custom Date...</option>
                  </select>
                  {dateFilter === "Custom" && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500/40 transition"
                    />
                  )}
                </div>
              </div>

              {/* Driver Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Driver</label>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-850 outline-none focus:bg-white focus:border-emerald-500/40 cursor-pointer transition"
                >
                  <option value="All">All Drivers</option>
                  <option value="Unassigned">Unassigned (Need Dispatch)</option>
                  <option value="Assigned">Assigned (Any Driver)</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={String(driver.id)}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bookings Scroll List */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {loading && (
              <div className="text-center py-20 text-slate-400 animate-pulse">
                Fetching bookings and real-time operations...
              </div>
            )}

            {!loading && filteredBookings.map((booking) => {
              const isSelected = selectedBooking && selectedBooking.id === booking.id;
              return (
                <div
                  key={booking.id}
                  onClick={() => handleSelectBooking(booking)}
                  className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                        {booking.booking_id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-2">
                        {booking.customer_name || "Guest Client"}
                      </h4>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusClass(booking.status)}`}>
                      {booking.status || "Pending"}
                    </span>
                  </div>

                  <div className="grid gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-600 text-xs">🟢</span>
                      <span className="truncate">{booking.pickup}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <span className="text-rose-500 text-xs">🔴</span>
                      <span className="truncate">{booking.dropoff}</span>
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold pt-2 border-t border-slate-100">
                    <div className="text-slate-400">
                      📅 {booking.travel_date} · 🕒 {booking.travel_time}
                    </div>
                    <div className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                      {booking.price} €
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && filteredBookings.length === 0 && (
              <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
                No matching booking logs found.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Detail Pane */}
        <div className="lg:col-span-5 relative lg:sticky lg:top-24">
          
          {selectedBooking ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-slate-800 shadow-xl space-y-6 animate-fade-in">
              
              {/* Card Header & Client Title */}
              <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700">{selectedBooking.booking_id}</span>
                    {selectedBooking.admin_notes && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                        Has Notes
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black mt-1 text-slate-900 leading-tight">
                    {selectedBooking.customer_name || "Guest Client"}
                  </h3>
                  <a
                    href={`tel:${selectedBooking.customer_phone}`}
                    className="text-xs text-emerald-600 hover:underline font-semibold mt-1 inline-block"
                  >
                    📞 {selectedBooking.customer_phone || "No phone"}
                  </a>
                </div>

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                >
                  Close Detail
                </button>
              </div>

              {/* Section 1: Flight & Accommodation details */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Flight Number</span>
                  <span className="text-slate-800 font-bold text-sm block mt-1">{selectedBooking.flight_number || "—"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Hotel / Accommodation</span>
                  <span className="text-slate-800 font-bold text-sm block mt-1 truncate">{selectedBooking.hotel_name || "—"}</span>
                </div>
              </div>

              {/* Section 2: Complete Route details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-emerald-700 font-bold block mb-1">🟢 Pickup Address</span>
                  <p className="text-slate-800 font-medium pl-4">{selectedBooking.pickup}</p>
                  {selectedBooking.pickup_details && (
                    <p className="text-[10px] text-slate-500 italic pl-4 mt-1">Details: {selectedBooking.pickup_details}</p>
                  )}
                </div>
                
                <hr className="border-slate-200" />

                <div>
                  <span className="text-rose-600 font-bold block mb-1">🔴 Drop-off Destination</span>
                  <p className="text-slate-800 font-medium pl-4">{selectedBooking.dropoff}</p>
                  {selectedBooking.dropoff_details && (
                    <p className="text-[10px] text-slate-500 italic pl-4 mt-1">Details: {selectedBooking.dropoff_details}</p>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-450 pt-2 border-t border-slate-200">
                  <span>Dist: {selectedBooking.distance ? `${Number(selectedBooking.distance).toFixed(1)} km` : "-"}</span>
                  <span>Est: {selectedBooking.duration || "-"}</span>
                  <span>Pax: {selectedBooking.passengers || "-"} · Bag: {selectedBooking.luggage || "-"}</span>
                </div>
              </div>

              {/* Section 3: Operations (Driver & Status controls) */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">Assign Driver</label>
                    <select
                      value={selectedBooking.driver_id || ""}
                      onChange={(e) => assignDriver(selectedBooking, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="">No Driver Assigned</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id} className="bg-white text-slate-800">
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">Transfer Status</label>
                    <select
                      value={selectedBooking.status || "Pending"}
                      onChange={(e) => updateBooking(selectedBooking.id, { status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase">Payout splits</p>
                    <p className="font-bold text-slate-700">
                      Driver: {selectedBooking.driver_share ? `${selectedBooking.driver_share} €` : "-"} / FastT: <span className="text-emerald-600">{selectedBooking.company_share ? `${selectedBooking.company_share} €` : "-"}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 text-[10px] text-slate-650 hover:text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBooking.driver_paid}
                        onChange={(e) => updateBooking(selectedBooking.id, { driver_paid: e.target.checked })}
                        className="w-3 h-3 accent-emerald-600"
                      />
                      Driver Paid
                    </label>

                    <label className="flex items-center gap-2 text-[10px] text-slate-650 hover:text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBooking.company_paid}
                        onChange={(e) => updateBooking(selectedBooking.id, { company_paid: e.target.checked })}
                        className="w-3 h-3 accent-emerald-600"
                      />
                      Company Paid
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 4: Custom Notes */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-slate-450">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter private notes, custom requirements, extra stops details..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500/40 resize-none transition"
                />
                <button
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="w-full rounded-xl bg-slate-100 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-transparent py-2.5 text-xs font-bold text-slate-700 transition duration-200 cursor-pointer"
                >
                  {isSavingNotes ? "Saving Notes..." : "Save Booking Notes"}
                </button>
              </div>

              {/* Section 5: External actions / dispatch */}
              <div className="grid gap-2 grid-cols-2 pt-2">
                <button
                  onClick={() => openMaps(selectedBooking)}
                  className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  🗺️ Google Maps
                </button>
                <button
                  onClick={() => openAdminWhatsApp(selectedBooking)}
                  className="rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 py-2.5 text-xs font-bold text-emerald-700 transition cursor-pointer"
                >
                  💬 Notify Admin
                </button>
                <button
                  onClick={() => openDriverWhatsApp(selectedBooking)}
                  className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer col-span-2"
                >
                  🚗 Dispatch Details to Driver
                </button>
                <button
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="rounded-xl border border-rose-200 hover:bg-rose-50 py-2.5 text-xs font-bold text-rose-600 transition cursor-pointer col-span-2"
                >
                  🗑️ Delete Booking Log
                </button>
              </div>

            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm h-[60vh] flex flex-col justify-center items-center">
              <span className="text-4xl mb-4">🚖</span>
              <h4 className="text-sm font-bold text-slate-700 mb-2">No Booking Selected</h4>
              <p className="text-xs max-w-[250px] leading-relaxed">
                Click on any booking card on the left panel to inspect detailed addresses, flight codes, accommodate names, dispatch triggers and manage custom notes.
              </p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

function Stat({ title, value, icon, desc, highlight = false }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 hover:shadow-md transition duration-300 ${
      highlight ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)] bg-emerald-50/10' : 'border-slate-200/80 shadow-sm'
    }`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{title}</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-lg">
          {icon}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-3">{desc}</p>
    </div>
  );
}