"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Driver management states
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    car: "",
    plate: "",
    commission_type: "fixed",
    commission_value: 85,
    status: "Active",
    password: ""
  });
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [isSavingDriver, setIsSavingDriver] = useState(false);

  // Client and report drill-down states
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedReportDriver, setSelectedReportDriver] = useState(null); // { id, name }

  const handleOpenDriversModal = () => {
    setIsDriversModalOpen(true);
  };

  const handleAddDriver = () => {
    setDriverForm({
      id: null,
      name: "",
      email: "",
      phone: "",
      car: "",
      plate: "",
      commission_type: "fixed",
      commission_value: 85,
      status: "Active",
      password: ""
    });
    setIsEditingDriver(false);
    setIsDriverFormOpen(true);
  };

  const handleEditDriver = (driver) => {
    setDriverForm({
      id: driver.id,
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      car: driver.car || "",
      plate: driver.plate || "",
      commission_type: driver.commission_type || "fixed",
      commission_value: driver.commission_value || 85,
      status: driver.status ? driver.status.trim() : "Active",
      password: ""
    });
    setIsEditingDriver(true);
    setIsDriverFormOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setIsSavingDriver(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!isEditingDriver) {
        // 1. Create Auth account if email and password are provided
        if (driverForm.email && driverForm.password) {
          const tempSupabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false }
          });
          
          const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
            email: driverForm.email,
            password: driverForm.password,
            options: {
              data: {
                full_name: driverForm.name,
                phone: driverForm.phone
              }
            }
          });

          if (signUpError && signUpError.message !== "User already registered") {
            alert("Auth Registration Error: " + signUpError.message);
            setIsSavingDriver(false);
            return;
          }
        }
      }

      // 2. Save to 'drivers' table
      const driverData = {
        name: driverForm.name,
        email: driverForm.email || null,
        phone: driverForm.phone || null,
        car: driverForm.car || "",
        plate: driverForm.plate || "",
        commission_type: driverForm.commission_type,
        commission_value: Number(driverForm.commission_value),
        status: driverForm.status
      };

      if (isEditingDriver) {
        const { error } = await supabase
          .from("drivers")
          .update(driverData)
          .eq("id", driverForm.id);

        if (error) throw error;
        alert("Driver updated successfully!");
      } else {
        const { error } = await supabase
          .from("drivers")
          .insert(driverData);

        if (error) throw error;
        alert("Driver created successfully!");
      }

      setIsDriverFormOpen(false);
      fetchData(true);
    } catch (err) {
      alert("Error saving driver: " + err.message);
    } finally {
      setIsSavingDriver(false);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!confirm("Are you sure you want to delete this driver? This action cannot be undone.")) return;

    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", driverId);

    if (error) {
      alert("Error deleting driver: " + error.message);
    } else {
      alert("Driver deleted successfully!");
      fetchData(true);
    }
  };

  const uniqueClients = useMemo(() => {
    const clientsMap = {};
    bookings.forEach(b => {
      const email = b.customer_email || b.customer_phone || b.customer_name;
      if (!email) return;
      
      const key = email.toLowerCase().trim();
      if (!clientsMap[key]) {
        clientsMap[key] = {
          name: b.customer_name || "—",
          email: b.customer_email || "—",
          phone: b.customer_phone || "—",
          bookingsCount: 0,
          totalSpent: 0
        };
      }
      clientsMap[key].bookingsCount += 1;
      if (b.status !== "Cancelled") {
        clientsMap[key].totalSpent += Number(b.total_price || b.price || 0);
      }
    });
    return Object.values(clientsMap);
  }, [bookings]);

  const handleResetClientPassword = async (email) => {
    if (!email || email === "—" || !email.includes("@")) {
      alert("Ky përdorues nuk ka një email të vlefshëm për të dërguar rivendosjen.");
      return;
    }
    
    if (!confirm(`A jeni i sigurt që dëshironi të dërgoni email-in e rivendosjes së fjalëkalimit për: ${email}?`)) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    
    if (error) {
      alert("Gabim gjatë dërgimit: " + error.message);
    } else {
      alert("Email-i për rivendosjen e fjalëkalimit u dërgua me sukses te: " + email);
    }
  };

  // Monthly stats & reset states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [autoZeroFirstDays, setAutoZeroFirstDays] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'revenue' | 'drivers' | 'platform'
  const [modalSearch, setModalSearch] = useState("");

  // Albanian months lookup for select month dropdown
  const formatMonthNameStr = (ym) => {
    if (!ym) return "";
    const [year, month] = ym.split("-");
    const ALBANIAN_MONTHS = {
      "01": "Janar", "02": "Shkurt", "03": "Mars", "04": "Prill",
      "05": "Maj", "06": "Qershor", "07": "Korrik", "08": "Gusht",
      "09": "Shtator", "10": "Tetor", "11": "Nëntor", "12": "Dhjetor"
    };
    return `${ALBANIAN_MONTHS[month] || month} ${year}`;
  };

  // Derive unique months from bookings data
  const availableMonths = useMemo(() => {
    const months = new Set();
    const d = new Date();
    const currentYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.add(currentYM);

    bookings.forEach((b) => {
      if (b.travel_date && b.travel_date.length >= 7) {
        months.add(b.travel_date.substring(0, 7));
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [bookings]);

  // Filter bookings for the selected month
  const monthlyBookings = useMemo(() => {
    return bookings.filter(b => b.travel_date && b.travel_date.startsWith(selectedMonth));
  }, [bookings, selectedMonth]);

  // Determine if stats should be forced to zero (days 1-3 of current month)
  const isZeroPeriod = useMemo(() => {
    if (!autoZeroFirstDays) return false;
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (selectedMonth !== currentYM) return false;
    return now.getDate() <= 3;
  }, [selectedMonth, autoZeroFirstDays]);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "FastAdmin2026!") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Fjalëkalim i gabuar!");
    }
  };

  const selectedBookingRef = useRef(selectedBooking);
  useEffect(() => {
    selectedBookingRef.current = selectedBooking;
  }, [selectedBooking]);

  async function fetchData(isSilent = false) {
    if (!isSilent) setLoading(true);

    const bookingsResult = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    const driversResult = await supabase
      .from("drivers")
      .select("*")
      .order("id", { ascending: true });

    if (bookingsResult.error) alert(bookingsResult.error.message);
    if (driversResult.error) alert(driversResult.error.message);

    const loadedBookings = bookingsResult.data || [];
    setBookings(loadedBookings);
    setDrivers(driversResult.data || []);

    // Keep selected booking reference updated if it exists
    const currentSelected = selectedBookingRef.current;
    if (currentSelected) {
      const updatedSelected = loadedBookings.find(b => b.id === currentSelected.id);
      if (updatedSelected) {
        setSelectedBooking(updatedSelected);
        setAdminNotes(updatedSelected.admin_notes || "");
      }
    }

    if (!isSilent) setLoading(false);
  }

  useEffect(() => {
    fetchData(false);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 120000);

    return () => clearInterval(intervalId);
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
    const totalBookingsCount = monthlyBookings.length;
    const cancelledCount = monthlyBookings.filter(b => b.status === "Cancelled").length;
    const activeCount = totalBookingsCount - cancelledCount;

    const activeMonthlyBookings = monthlyBookings.filter(b => b.status !== "Cancelled");

    let revenue = activeMonthlyBookings.reduce(
      (sum, b) => sum + Number(b.total_price || b.price || 0),
      0
    );

    let driverTotal = activeMonthlyBookings.reduce(
      (sum, b) => sum + Number(b.driver_share || 0),
      0
    );

    let companyTotal = activeMonthlyBookings.reduce(
      (sum, b) => sum + Number(b.company_share || 0),
      0
    );

    // Apply zeroing out if we are in the zero-out period
    if (isZeroPeriod) {
      revenue = 0;
      driverTotal = 0;
      companyTotal = 0;
    }

    return {
      bookings: totalBookingsCount,
      active: activeCount,
      cancelled: cancelledCount,
      revenue,
      driverTotal,
      companyTotal,
      pending: bookings.filter((b) => b.status === "Pending").length, // Action Needed remains global
    };
  }, [bookings, monthlyBookings, isZeroPeriod]);

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

    driverShare = Math.round(totalPrice * 0.85);

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
    const pickupMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickup || "")}`;
    const dropoffMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.dropoff || "")}`;
    const routeMapUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.pickup || "")}&destination=${encodeURIComponent(booking.dropoff || "")}&travelmode=driving`;

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
📍 *Pickup Map:* ${pickupMapUrl}
📝 *Pickup Details:* ${booking.pickup_details || "None"}

🔴 *Drop-off Address:* ${booking.dropoff || "-"}
📍 *Drop-off Map:* ${dropoffMapUrl}
📝 *Drop-off Details:* ${booking.dropoff_details || "None"}

🗺️ *Navigation Route:* ${routeMapUrl}

👥 *Passengers:* ${booking.passengers || "1"}
🧳 *Luggage:* ${booking.luggage || "0"}

📏 *Distance:* ${booking.distance ? `${Number(booking.distance).toFixed(1)} km` : "-"}
⏱ *Est. Duration:* ${booking.duration || "-"}

💶 *TOTAL:* ${booking.price || "-"} €
----------------------------------------
🚗 *Assigned Driver:* ${booking.driver_name || "None"}
⚙️ *Status:* ${booking.status || "Pending"}
📝 *Admin Notes:* ${booking.admin_notes || "None"}
----------------------------------------`;
  }

  // Report Export Helpers
  const exportToCSV = (title, headers, rows) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(r => {
      csvContent += r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = (title, headers, rows) => {
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; }
            h2 { color: #047857; text-align: center; }
            .meta { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: #f3f4f6; color: #1f2937; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .total-row { font-weight: bold; background-color: #e5e7eb !important; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div class="meta">Muaji: ${formatMonthNameStr(selectedMonth)} | Gjeneruar më: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => {
                const isLast = i === rows.length - 1;
                const className = isLast ? ' class="total-row"' : '';
                return `<tr${className}>${r.map(c => `<td>${c}</td>`).join("")}</tr>`;
              }).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_${selectedMonth}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (title, headers, rows) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Ju lutem lejoni pop-ups për të shkarkuar PDF.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1f2937; }
            .header-container { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { color: #047857; margin: 0; font-size: 24px; font-weight: 800; }
            .meta { font-size: 12px; color: #4b5563; text-align: right; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: #f3f4f6; color: #1f2937; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .total-row { font-weight: bold; background-color: #f3f4f6 !important; border-top: 2px solid #1f2937; }
            .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1>${title}</h1>
              <div style="font-size: 13px; font-weight: 600; color: #4b5563; margin-top: 4px;">Fast Transfers</div>
            </div>
            <div class="meta">
              <div><strong>Muaji:</strong> ${formatMonthNameStr(selectedMonth)}</div>
              <div><strong>Gjeneruar më:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => {
                const isLast = i === rows.length - 1;
                const className = isLast ? ' class="total-row"' : '';
                return `<tr${className}>${r.map(c => `<td>${c}</td>`).join("")}</tr>`;
              }).join("")}
            </tbody>
          </table>
          <div class="footer">Raport i gjeneruar automatikisht nga paneli i administrimit Fast Transfers.</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Modal 1 Calculations - Gross Revenue
  const modalFilteredRevenueBookings = useMemo(() => {
    return monthlyBookings
      .filter(b => b.status !== "Cancelled")
      .filter(b => {
        const text = `${b.booking_id} ${b.customer_name || ""} ${b.pickup} ${b.dropoff} ${b.driver_name || ""}`.toLowerCase();
        return text.includes(modalSearch.toLowerCase());
      });
  }, [monthlyBookings, modalSearch]);

  const revenueRows = useMemo(() => {
    const list = modalFilteredRevenueBookings.map(b => [
      b.travel_date,
      b.booking_id,
      b.customer_name || "-",
      b.driver_name || "Unassigned",
      `${b.pickup} ➔ ${b.dropoff}`,
      b.status || "Pending",
      `${b.total_price || b.price || 0} €`
    ]);

    const totalSum = modalFilteredRevenueBookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
    list.push(["TOTALI", `${modalFilteredRevenueBookings.length} booking(s)`, "", "", "", "", `${totalSum} €`]);
    return list;
  }, [modalFilteredRevenueBookings]);

  // Modal 2 Calculations - Drivers Share
  const driverSummaries = useMemo(() => {
    const summaries = {};
    drivers.forEach(d => {
      // Find all bookings for this driver to compute average rating
      const driverBookingsWithRating = bookings.filter(b => b.driver_id === d.id && b.rating_driver);
      const totalRatingsCount = driverBookingsWithRating.length;
      const sumRatings = driverBookingsWithRating.reduce((sum, b) => sum + b.rating_driver, 0);
      const avgRating = totalRatingsCount > 0 ? (sumRatings / totalRatingsCount).toFixed(1) : null;

      summaries[d.id] = {
        name: d.name,
        phone: d.phone || "-",
        email: d.email || "-",
        bookingsCount: 0,
        driverShare: 0,
        companyShare: 0,
        totalGross: 0,
        avgRating: avgRating ? `${avgRating} ★ (${totalRatingsCount})` : "—",
      };
    });

    monthlyBookings.forEach(b => {
      if (b.status === "Cancelled") return;
      if (b.driver_id) {
        if (!summaries[b.driver_id]) {
          summaries[b.driver_id] = {
            name: b.driver_name || `Driver ID: ${b.driver_id}`,
            phone: "-",
            email: "-",
            bookingsCount: 0,
            driverShare: 0,
            companyShare: 0,
            totalGross: 0,
            avgRating: "—",
          };
        }
        summaries[b.driver_id].bookingsCount += 1;
        summaries[b.driver_id].driverShare += Number(b.driver_share || 0);
        summaries[b.driver_id].companyShare += Number(b.company_share || 0);
        summaries[b.driver_id].totalGross += Number(b.total_price || b.price || 0);
      }
    });

    return Object.values(summaries).filter(ds => {
      const text = `${ds.name} ${ds.phone} ${ds.email}`.toLowerCase();
      return text.includes(modalSearch.toLowerCase());
    });
  }, [drivers, monthlyBookings, bookings, modalSearch]);

  const driversShareRows = useMemo(() => {
    const list = driverSummaries.map(ds => [
      ds.name,
      ds.phone,
      ds.email,
      ds.bookingsCount,
      ds.avgRating,
      `${ds.driverShare} €`,
      `${ds.companyShare} €`,
      `${ds.totalGross} €`
    ]);

    const totalBookings = driverSummaries.reduce((sum, ds) => sum + ds.bookingsCount, 0);
    const totalDriverShare = driverSummaries.reduce((sum, ds) => sum + ds.driverShare, 0);
    const totalCompanyShare = driverSummaries.reduce((sum, ds) => sum + ds.companyShare, 0);
    const totalGross = driverSummaries.reduce((sum, ds) => sum + ds.totalGross, 0);

    list.push(["TOTALI", `${driverSummaries.length} shoferë`, "", totalBookings, "", `${totalDriverShare} €`, `${totalCompanyShare} €`, `${totalGross} €`]);
    return list;
  }, [driverSummaries]);

  const driverBookingsSummary = useMemo(() => {
    return drivers.map(d => {
      const driverBookings = monthlyBookings.filter(b => b.driver_id === d.id);
      const active = driverBookings.filter(b => b.status !== "Cancelled").length;
      const completed = driverBookings.filter(b => b.status === "Completed").length;
      const cancelled = driverBookings.filter(b => b.status === "Cancelled").length;
      return {
        name: d.name,
        active,
        completed,
        cancelled,
        total: driverBookings.length
      };
    });
  }, [drivers, monthlyBookings]);

  // Selected driver detail bookings calculation
  const driverDetailBookings = useMemo(() => {
    if (!selectedReportDriver) return [];
    return monthlyBookings.filter(b => b.driver_id === selectedReportDriver.id && b.status !== "Cancelled");
  }, [selectedReportDriver, monthlyBookings]);

  const driverTripRows = useMemo(() => {
    if (!selectedReportDriver) return [];
    const list = driverDetailBookings.map(b => [
      b.travel_date,
      b.booking_id,
      b.customer_name || "-",
      `${b.pickup} ➔ ${b.dropoff}`,
      `${b.driver_share || 0} €`,
      `${b.company_share || 0} €`,
      `${b.total_price || b.price || 0} €`
    ]);
    
    const sumDriverShare = driverDetailBookings.reduce((sum, b) => sum + Number(b.driver_share || 0), 0);
    const sumCompanyShare = driverDetailBookings.reduce((sum, b) => sum + Number(b.company_share || 0), 0);
    const sumTotal = driverDetailBookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
    
    list.push(["TOTALI", `${driverDetailBookings.length} udhëtime`, "", "", `${sumDriverShare} €`, `${sumCompanyShare} €`, `${sumTotal} €`]);
    return list;
  }, [selectedReportDriver, driverDetailBookings]);

  // Modal 3 Calculations - Platform Earnings
  const modalFilteredPlatformBookings = useMemo(() => {
    return monthlyBookings
      .filter(b => b.status !== "Cancelled")
      .filter(b => {
        const text = `${b.booking_id} ${b.customer_name || ""} ${b.pickup} ${b.dropoff} ${b.driver_name || ""}`.toLowerCase();
        return text.includes(modalSearch.toLowerCase());
      });
  }, [monthlyBookings, modalSearch]);

  const platformEarningsRows = useMemo(() => {
    const list = modalFilteredPlatformBookings.map(b => [
      b.travel_date,
      b.booking_id,
      b.customer_name || "-",
      b.driver_name || "Unassigned",
      `${b.total_price || b.price || 0} €`,
      `${b.driver_share || 0} €`,
      `${b.company_share || 0} €`,
      `Shoferi: ${b.driver_paid ? 'Kryer' : 'Pa kryer'} / FastT: ${b.company_paid ? 'Kryer' : 'Pa kryer'}`
    ]);

    const totalFare = modalFilteredPlatformBookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
    const totalDriver = modalFilteredPlatformBookings.reduce((sum, b) => sum + Number(b.driver_share || 0), 0);
    const totalCompany = modalFilteredPlatformBookings.reduce((sum, b) => sum + Number(b.company_share || 0), 0);

    list.push(["TOTALI", `${modalFilteredPlatformBookings.length} booking(s)`, "", "", `${totalFare} €`, `${totalDriver} €`, `${totalCompany} €`, ""]);
    return list;
  }, [modalFilteredPlatformBookings]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl">🚖</span>
            <h2 className="text-2xl font-black text-slate-900">Fast Transfers</h2>
            <p className="text-xs text-slate-450 uppercase tracking-widest font-bold">Admin Panel Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fjalëkalimi (Admin Password)</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Shkruaj fjalëkalimin..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:border-emerald-500/40 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 text-xs tracking-wider uppercase transition duration-300 shadow-sm cursor-pointer"
            >
              Hyni në Panel (Login)
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-800 md:px-12 relative">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Top Header Section */}
      <div className="relative z-10 mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-center border-b border-slate-200 pb-6">
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenDriversModal}
            className="rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-extrabold px-5 py-3 text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            🚗 Manage Drivers
          </button>
          <button
            onClick={() => {
              setIsClientsModalOpen(true);
            }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-3 text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            👥 Manage Clients
          </button>
          <button
            onClick={fetchData}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            Refresh Data
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              window.location.href = "/";
            }}
            className="rounded-xl border border-rose-500 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-5 py-3 text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            🚪 Exit / Log Out
          </button>
        </div>
      </div>

      {/* Report Configuration & Month Selector Bar */}
      <div className="relative z-10 mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zgjidh Muajin (Select Month)</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setModalSearch("");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/40 cursor-pointer transition"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthNameStr(ym)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4 md:pt-0">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-650 hover:text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoZeroFirstDays}
                onChange={(e) => setAutoZeroFirstDays(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded border-slate-200"
              />
              <span>Zero-zerohet në ditët 1-3 (Reset days 1-3)</span>
            </label>
            {isZeroPeriod && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                Aktive (Zeroed Out)
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Statusi i Mbylljes</p>
          <p className="text-xs font-bold text-slate-700">
            {isZeroPeriod ? "Në proces mbylljeje (0 €)" : `Aktiv: ${formatMonthNameStr(selectedMonth)}`}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat 
          title="Total Bookings" 
          value={stats.active} 
          icon="📊" 
          desc={`Active: ${stats.active} | Cancelled: ${stats.cancelled} (Click)`} 
          onClick={() => { setActiveModal("total_bookings"); setModalSearch(""); }}
        />
        <Stat 
          title="Gross Revenue" 
          value={`${stats.revenue} €`} 
          icon="💶" 
          desc="Sum of active transfers (Click)" 
          onClick={() => { setActiveModal("revenue"); setModalSearch(""); }} 
          isZeroed={isZeroPeriod} 
        />
        <Stat 
          title="Drivers share" 
          value={`${stats.driverTotal} €`} 
          icon="🚗" 
          desc="Driver payouts of active rides (Click)" 
          onClick={() => { setActiveModal("drivers"); setModalSearch(""); }} 
          isZeroed={isZeroPeriod} 
        />
        <Stat 
          title="Platform earnings" 
          value={`${stats.companyTotal} €`} 
          icon="🏢" 
          desc="Company commission of active rides (Click)" 
          onClick={() => { setActiveModal("platform"); setModalSearch(""); }} 
          isZeroed={isZeroPeriod} 
        />
        <Stat 
          title="Action Needed" 
          value={stats.pending} 
          icon="⏳" 
          desc="Pending assignments" 
          highlight={stats.pending > 0} 
        />
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
                  className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${isSelected
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
                  <div className="flex flex-col gap-1 mt-1.5">
                    <a
                      href={`tel:${selectedBooking.customer_phone}`}
                      className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <span>📞</span> {selectedBooking.customer_phone || "No phone"}
                    </a>
                    {selectedBooking.customer_email && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        📧 {selectedBooking.customer_email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5">
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 block leading-none">{selectedBooking.price} €</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Total Price</span>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Close Detail
                  </button>
                </div>
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
                      {drivers.filter(d => d.status && d.status.trim() === "Active").map((driver) => (
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
              
              {/* Section: Client Review & Feedback (if present) */}
              {(selectedBooking.rating_website || selectedBooking.review_comment) && (
                <div className="space-y-2 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-xs">
                  <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">Client Review & Feedback</span>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Service Rating</span>
                      <span className="font-bold text-amber-600">{selectedBooking.rating_website ? `${selectedBooking.rating_website} / 5 ★` : "—"}</span>
                    </div>
                    {selectedBooking.rating_driver && (
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Driver Rating</span>
                        <span className="font-bold text-amber-600">{selectedBooking.rating_driver} / 5 ★</span>
                      </div>
                    )}
                  </div>
                  {selectedBooking.review_comment && (
                    <div className="mt-3 pt-2 border-t border-amber-500/10">
                      <span className="text-slate-400 block text-[9px] uppercase">Client Comment</span>
                      <p className="text-slate-700 font-medium italic mt-1 bg-white/50 p-2.5 rounded-lg">
                        "{selectedBooking.review_comment}"
                      </p>
                    </div>
                  )}
                </div>
              )}

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

      {/* Detail Report Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {activeModal === "revenue" && `Detajet e Gross Revenue — ${formatMonthNameStr(selectedMonth)}`}
                  {activeModal === "drivers" && (
                    selectedReportDriver
                      ? `Udhëtimet e kryera nga ${selectedReportDriver.name} — ${formatMonthNameStr(selectedMonth)}`
                      : `Detajet e Drivers Share — ${formatMonthNameStr(selectedMonth)}`
                  )}
                  {activeModal === "platform" && `Detajet e Platform Earnings — ${formatMonthNameStr(selectedMonth)}`}
                  {activeModal === "total_bookings" && `Statistikat e Rezervimeve — ${formatMonthNameStr(selectedMonth)}`}
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Këtu po shihni analizën e plotë të të dhënave për muajin e zgjedhur.
                  {isZeroPeriod && " (Shënim: Në dashboard këto vlera janë zeroed-out për mbylljen e muajit)"}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setModalSearch("");
                  setSelectedReportDriver(null);
                }}
                className="text-2xl text-slate-450 hover:text-slate-900 leading-none p-1 cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Actions & Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              {activeModal === "drivers" && selectedReportDriver ? (
                <button
                  onClick={() => setSelectedReportDriver(null)}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 text-xs transition cursor-pointer"
                >
                  ← Kthehu te Shoferët (All Drivers)
                </button>
              ) : activeModal === "total_bookings" ? (
                <div className="text-xs text-slate-500 font-medium">Përmbledhje analitike e statusit të rezervimeve për çdo shofer.</div>
              ) : (
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder={
                      activeModal === "drivers" 
                        ? "Kërko shofer..." 
                        : "Kërko Client, Booking ID, Shofer..."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-455 focus:bg-white focus:border-emerald-500/40 transition"
                  />
                </div>
              )}

              {/* Export Buttons */}
              {activeModal !== "total_bookings" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeModal === "revenue") exportToPDF(`Raporti i Gross Revenue`, ["Data", "Booking ID", "Klienti", "Shoferi", "Rruga", "Statusi", "Pagesa"], revenueRows);
                      if (activeModal === "drivers") {
                        if (selectedReportDriver) {
                          exportToPDF(`Raporti i Udhëtimeve - ${selectedReportDriver.name}`, ["Data", "Booking ID", "Klienti", "Rruga", "Driver Share", "Company Share", "Total Gross"], driverTripRows);
                        } else {
                          exportToPDF(`Raporti i Drivers Share`, ["Shoferi", "Telefon", "Email", "Total Bookings", "Vlerësimi", "Driver Share", "Company Share", "Total Gross"], driversShareRows);
                        }
                      }
                      if (activeModal === "platform") exportToPDF(`Raporti i Platform Earnings`, ["Data", "Booking ID", "Klienti", "Shoferi", "Total Fare", "Driver Share", "Platform Share", "Statusi"], platformEarningsRows);
                    }}
                    className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-4 py-2 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      if (activeModal === "revenue") exportToWord(`Raporti i Gross Revenue`, ["Data", "Booking ID", "Klienti", "Shoferi", "Rruga", "Statusi", "Pagesa"], revenueRows);
                      if (activeModal === "drivers") {
                        if (selectedReportDriver) {
                          exportToWord(`Raporti i Udhëtimeve - ${selectedReportDriver.name}`, ["Data", "Booking ID", "Klienti", "Rruga", "Driver Share", "Company Share", "Total Gross"], driverTripRows);
                        } else {
                          exportToWord(`Raporti i Drivers Share`, ["Shoferi", "Telefon", "Email", "Total Bookings", "Vlerësimi", "Driver Share", "Company Share", "Total Gross"], driversShareRows);
                        }
                      }
                      if (activeModal === "platform") exportToWord(`Raporti i Platform Earnings`, ["Data", "Booking ID", "Klienti", "Shoferi", "Total Fare", "Driver Share", "Platform Share", "Statusi"], platformEarningsRows);
                    }}
                    className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-4 py-2 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    📝 Word
                  </button>
                  <button
                    onClick={() => {
                      if (activeModal === "revenue") exportToCSV(`Raporti i Gross Revenue`, ["Data", "Booking ID", "Klienti", "Shoferi", "Rruga", "Statusi", "Pagesa"], revenueRows);
                      if (activeModal === "drivers") {
                        if (selectedReportDriver) {
                          exportToCSV(`Raporti i Udhëtimeve - ${selectedReportDriver.name}`, ["Data", "Booking ID", "Klienti", "Rruga", "Driver Share", "Company Share", "Total Gross"], driverTripRows);
                        } else {
                          exportToCSV(`Raporti i Drivers Share`, ["Shoferi", "Telefon", "Email", "Total Bookings", "Vlerësimi", "Driver Share", "Company Share", "Total Gross"], driversShareRows);
                        }
                      }
                      if (activeModal === "platform") exportToCSV(`Raporti i Platform Earnings`, ["Data", "Booking ID", "Klienti", "Shoferi", "Total Fare", "Driver Share", "Platform Share", "Statusi"], platformEarningsRows);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold px-4 py-2 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    📊 Excel (CSV)
                  </button>
                </div>
              )}
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200/60 custom-scrollbar shadow-inner bg-slate-50/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
                  {activeModal === "revenue" && (
                    <tr>
                      <th className="p-3.5">Data</th>
                      <th className="p-3.5">Booking ID</th>
                      <th className="p-3.5">Klienti</th>
                      <th className="p-3.5">Shoferi</th>
                      <th className="p-3.5">Rruga</th>
                      <th className="p-3.5">Statusi</th>
                      <th className="p-3.5 text-right">Pagesa</th>
                    </tr>
                  )}
                  {activeModal === "drivers" && (
                    selectedReportDriver ? (
                      <tr>
                        <th className="p-3.5">Data</th>
                        <th className="p-3.5">Booking ID</th>
                        <th className="p-3.5">Klienti</th>
                        <th className="p-3.5">Rruga</th>
                        <th className="p-3.5 text-right">Driver Share (€)</th>
                        <th className="p-3.5 text-right">Company Share (€)</th>
                        <th className="p-3.5 text-right">Total Gross (€)</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-3.5">Shoferi</th>
                        <th className="p-3.5">Telefon</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5 text-center">Total Bookings</th>
                        <th className="p-3.5 text-center">Vlerësimi</th>
                        <th className="p-3.5 text-right">Driver Share (€)</th>
                        <th className="p-3.5 text-right">Company Share (€)</th>
                        <th className="p-3.5 text-right">Total Gross (€)</th>
                      </tr>
                    )
                  )}
                  {activeModal === "platform" && (
                    <tr>
                      <th className="p-3.5">Data</th>
                      <th className="p-3.5">Booking ID</th>
                      <th className="p-3.5">Klienti</th>
                      <th className="p-3.5">Shoferi</th>
                      <th className="p-3.5 text-right">Total Fare (€)</th>
                      <th className="p-3.5 text-right">Driver Share (€)</th>
                      <th className="p-3.5 text-right">Platform Share (€)</th>
                      <th className="p-3.5 text-center">Statusi i Pagesave</th>
                    </tr>
                  )}
                  {activeModal === "total_bookings" && (
                    <tr>
                      <th className="p-3.5">Shoferi (Driver)</th>
                      <th className="p-3.5 text-center">Udhëtime Aktive (Active)</th>
                      <th className="p-3.5 text-center">Të Përfunduara (Completed)</th>
                      <th className="p-3.5 text-center">Të Anulluara (Cancelled)</th>
                      <th className="p-3.5 text-center">Gjithsej (Total)</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {activeModal === "drivers" && (
                    selectedReportDriver ? (
                      driverTripRows.slice(0, -1).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 font-medium text-slate-500 whitespace-nowrap">{row[0]}</td>
                          <td className="p-3.5"><span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">{row[1]}</span></td>
                          <td className="p-3.5 font-bold text-slate-800">{row[2]}</td>
                          <td className="p-3.5 text-slate-500 max-w-[250px] truncate" title={row[3]}>{row[3]}</td>
                          <td className="p-3.5 text-right font-semibold text-emerald-600">{row[4]}</td>
                          <td className="p-3.5 text-right font-semibold text-slate-700">{row[5]}</td>
                          <td className="p-3.5 text-right font-black text-slate-900 bg-slate-50/50">{row[6]}</td>
                        </tr>
                      ))
                    ) : (
                      driverSummaries.map((ds, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 font-bold text-emerald-600 hover:underline cursor-pointer" onClick={() => setSelectedReportDriver({ id: ds.id, name: ds.name })}>
                            👤 {ds.name} (Hap detajet ➔)
                          </td>
                          <td className="p-3.5 font-semibold text-slate-650">{ds.phone}</td>
                          <td className="p-3.5 font-semibold text-slate-650">{ds.email}</td>
                          <td className="p-3.5 text-center font-bold text-slate-700">{ds.bookingsCount}</td>
                          <td className="p-3.5 text-center font-bold text-amber-600">{ds.avgRating}</td>
                          <td className="p-3.5 text-right font-black text-emerald-600">{ds.driverShare} €</td>
                          <td className="p-3.5 text-right font-black text-slate-850">{ds.companyShare} €</td>
                          <td className="p-3.5 text-right font-black text-slate-900 bg-slate-50">{ds.totalGross} €</td>
                        </tr>
                      ))
                    )
                  )}

                  {activeModal === "platform" && platformEarningsRows.slice(0, -1).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-medium text-slate-500 whitespace-nowrap">{row[0]}</td>
                      <td className="p-3.5"><span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">{row[1]}</span></td>
                      <td className="p-3.5 font-bold text-slate-800">{row[2]}</td>
                      <td className="p-3.5 text-slate-600 font-semibold">{row[3]}</td>
                      <td className="p-3.5 text-right font-black text-slate-850">{row[4]}</td>
                      <td className="p-3.5 text-right font-black text-slate-600">{row[5]}</td>
                      <td className="p-3.5 text-right font-black text-emerald-600">{row[6]}</td>
                      <td className="p-3.5 text-center text-[10px] font-bold text-slate-500">{row[7]}</td>
                    </tr>
                  ))}

                  {activeModal === "total_bookings" && driverBookingsSummary.map((ds, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-bold text-slate-800">{ds.name}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-600">{ds.active}</td>
                      <td className="p-3.5 text-center font-semibold text-emerald-600">{ds.completed}</td>
                      <td className="p-3.5 text-center font-semibold text-rose-600">{ds.cancelled}</td>
                      <td className="p-3.5 text-center font-black text-slate-900 bg-slate-50/50">{ds.total}</td>
                    </tr>
                  ))}

                  {/* Summary / Total Row */}
                  {activeModal === "revenue" && revenueRows.length > 1 && (
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold z-10 sticky bottom-0 text-slate-800">
                      <td className="p-3.5">{revenueRows[revenueRows.length - 1][0]}</td>
                      <td className="p-3.5">{revenueRows[revenueRows.length - 1][1]}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 text-right text-base text-slate-900 font-black">{revenueRows[revenueRows.length - 1][6]}</td>
                    </tr>
                  )}

                  {activeModal === "drivers" && (
                    selectedReportDriver ? (
                      driverTripRows.length > 1 && (
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold z-10 sticky bottom-0 text-slate-800">
                          <td className="p-3.5">{driverTripRows[driverTripRows.length - 1][0]}</td>
                          <td className="p-3.5">{driverTripRows[driverTripRows.length - 1][1]}</td>
                          <td className="p-3.5"></td>
                          <td className="p-3.5"></td>
                          <td className="p-3.5 text-right text-sm text-emerald-600 font-black">{driverTripRows[driverTripRows.length - 1][4]}</td>
                          <td className="p-3.5 text-right text-sm font-black">{driverTripRows[driverTripRows.length - 1][5]}</td>
                          <td className="p-3.5 text-right text-base text-slate-900 font-black bg-slate-150">{driverTripRows[driverTripRows.length - 1][6]}</td>
                        </tr>
                      )
                    ) : (
                      driversShareRows.length > 1 && (
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold z-10 sticky bottom-0 text-slate-800">
                          <td className="p-3.5">{driversShareRows[driversShareRows.length - 1][0]}</td>
                          <td className="p-3.5">{driversShareRows[driversShareRows.length - 1][1]}</td>
                          <td className="p-3.5">{driversShareRows[driversShareRows.length - 1][2]}</td>
                          <td className="p-3.5 text-center text-sm font-black">{driversShareRows[driversShareRows.length - 1][3]}</td>
                          <td className="p-3.5 text-center font-bold"></td>
                          <td className="p-3.5 text-right text-sm text-emerald-600 font-black">{driversShareRows[driversShareRows.length - 1][5]}</td>
                          <td className="p-3.5 text-right text-sm font-black">{driversShareRows[driversShareRows.length - 1][6]}</td>
                          <td className="p-3.5 text-right text-base text-slate-900 font-black bg-slate-150">{driversShareRows[driversShareRows.length - 1][7]}</td>
                        </tr>
                      )
                    )
                  )}

                  {activeModal === "platform" && platformEarningsRows.length > 1 && (
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold z-10 sticky bottom-0 text-slate-800">
                      <td className="p-3.5">{platformEarningsRows[platformEarningsRows.length - 1][0]}</td>
                      <td className="p-3.5">{platformEarningsRows[platformEarningsRows.length - 1][1]}</td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5"></td>
                      <td className="p-3.5 text-right text-sm font-black">{platformEarningsRows[platformEarningsRows.length - 1][4]}</td>
                      <td className="p-3.5 text-right text-sm font-black">{platformEarningsRows[platformEarningsRows.length - 1][5]}</td>
                      <td className="p-3.5 text-right text-base text-emerald-600 font-black">{platformEarningsRows[platformEarningsRows.length - 1][6]}</td>
                      <td className="p-3.5"></td>
                    </tr>
                  )}

                  {activeModal === "total_bookings" && (
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold z-10 sticky bottom-0 text-slate-800">
                      <td className="p-3.5">TOTALI</td>
                      <td className="p-3.5 text-center text-slate-650">{driverBookingsSummary.reduce((sum, ds) => sum + ds.active, 0)}</td>
                      <td className="p-3.5 text-center text-emerald-600">{driverBookingsSummary.reduce((sum, ds) => sum + ds.completed, 0)}</td>
                      <td className="p-3.5 text-center text-rose-600">{driverBookingsSummary.reduce((sum, ds) => sum + ds.cancelled, 0)}</td>
                      <td className="p-3.5 text-center text-base text-slate-900 font-black bg-slate-150">
                        {driverBookingsSummary.reduce((sum, ds) => sum + ds.total, 0)}
                      </td>
                    </tr>
                  )}

                  {/* Empty state for modal */}
                  {((activeModal === "revenue" && revenueRows.length <= 1) ||
                    (activeModal === "drivers" && !selectedReportDriver && driversShareRows.length <= 1) ||
                    (activeModal === "drivers" && selectedReportDriver && driverTripRows.length <= 1) ||
                    (activeModal === "platform" && platformEarningsRows.length <= 1) ||
                    (activeModal === "total_bookings" && driverBookingsSummary.length === 0)) && (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-slate-400 font-medium">
                        Nuk u gjetën të dhëna për këtë kërkim.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-150 pt-4">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setModalSearch("");
                }}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 text-xs transition cursor-pointer"
              >
                Mbyll
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clients Management Modal */}
      {isClientsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-slate-800">
          <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  👥 Menaxhimi i Klientëve (Client Management)
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Këtu shfaqet lista e të gjithë klientëve që kanë kryer rezervime. Mund të dërgoni emaile për rivendosjen e fjalëkalimit.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsClientsModalOpen(false);
                  setClientSearch("");
                }}
                className="text-2xl text-slate-455 hover:text-slate-900 leading-none p-1 cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Kërko klient me Emër, Email, Telefon..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-450 focus:bg-white focus:border-emerald-500/40 transition"
              />
            </div>

            {/* Clients Table Container */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200/60 custom-scrollbar shadow-inner bg-slate-50/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
                  <tr>
                    <th className="p-3.5">Klienti (Name)</th>
                    <th className="p-3.5">Telefon (Phone)</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5 text-center">Rezervime Gjithsej (Bookings)</th>
                    <th className="p-3.5 text-right">Shuma e Shpenzuar (Total Spent)</th>
                    <th className="p-3.5 text-center">Veprime (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {uniqueClients
                    .filter(c => {
                      const text = `${c.name} ${c.email} ${c.phone}`.toLowerCase();
                      return text.includes(clientSearch.toLowerCase());
                    })
                    .map((client, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold text-slate-800">{client.name}</td>
                        <td className="p-3.5 font-semibold text-slate-600">{client.phone}</td>
                        <td className="p-3.5 font-semibold text-slate-600">{client.email}</td>
                        <td className="p-3.5 text-center font-bold text-slate-700">{client.bookingsCount}</td>
                        <td className="p-3.5 text-right font-black text-emerald-600">{client.totalSpent} €</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleResetClientPassword(client.email)}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 text-[10px] transition cursor-pointer"
                          >
                            🔑 Password Reset
                          </button>
                        </td>
                      </tr>
                    ))}

                  {uniqueClients.filter(c => {
                    const text = `${c.name} ${c.email} ${c.phone}`.toLowerCase();
                    return text.includes(clientSearch.toLowerCase());
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                        Nuk u gjet asnjë klient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-150 pt-4">
              <button
                onClick={() => {
                  setIsClientsModalOpen(false);
                  setClientSearch("");
                }}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 text-xs transition cursor-pointer"
              >
                Mbyll
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Drivers Management Modal */}
      {isDriversModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-slate-800">
          <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  🚗 Menaxhimi i Shoferëve (Driver Management)
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Krijo shoferë të rinj me llogari hyrëse, ndrysho detajet ose statusin e tyre.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDriversModalOpen(false);
                  setIsDriverFormOpen(false);
                }}
                className="text-2xl text-slate-455 hover:text-slate-900 leading-none p-1 cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            {/* Main Modal Content Split: List on left, form on right */}
            <div className="flex-1 overflow-y-auto grid gap-6 md:grid-cols-12 min-h-0 pr-1 custom-scrollbar">
              
              {/* Left Column: Drivers List */}
              <div className={`${isDriverFormOpen ? "md:col-span-7" : "md:col-span-12"} space-y-4`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-450 uppercase">Shoferët e regjistruar ({drivers.length})</span>
                  {!isDriverFormOpen && (
                    <button
                      onClick={handleAddDriver}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 text-xs transition cursor-pointer"
                    >
                      + Shto Shofer të Ri
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">Emri</th>
                        <th className="p-3">Email / Telefon</th>
                        <th className="p-3">Mjeti / Targa</th>
                        <th className="p-3 text-center">Komisioni</th>
                        <th className="p-3 text-center">Statusi</th>
                        <th className="p-3 text-center">Veprime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {drivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{d.name}</td>
                          <td className="p-3 text-slate-600">
                            <div>{d.email || "—"}</div>
                            <div className="text-[10px] text-slate-400">{d.phone || "—"}</div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <div>{d.car || "—"}</div>
                            <div className="text-[10px] text-slate-450 font-mono">{d.plate || "—"}</div>
                          </td>
                          <td className="p-3 text-center font-semibold">
                            {d.commission_value}% ({d.commission_type})
                          </td>
                          <td className="p-3 text-center">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                              d.status && d.status.trim() === "Active"
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                : "text-rose-700 bg-rose-50 border border-rose-100"
                            }`}>
                              {d.status || "Inactive"}
                            </span>
                          </td>
                          <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditDriver(d)}
                              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleDeleteDriver(d.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}

                      {drivers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">Nuk ka shoferë në sistem.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Add/Edit Form Panel */}
              {isDriverFormOpen && (
                <div className="md:col-span-5 border border-slate-200 rounded-2xl bg-slate-50/50 p-5 space-y-4 animate-scale-in">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm">
                      {isEditingDriver ? "📝 Modifiko Shoferin" : "➕ Shto Shofer të Ri"}
                    </h4>
                    <button
                      onClick={() => setIsDriverFormOpen(false)}
                      className="text-xs text-slate-450 hover:text-slate-700"
                    >
                      Anullo
                    </button>
                  </div>

                  <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emri i Plotë</label>
                      <input
                        type="text"
                        value={driverForm.name}
                        onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                        placeholder="p.sh. Dionis Arapi"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                        <input
                          type="email"
                          value={driverForm.email}
                          onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                          placeholder="shoferi@fast.com"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Numri i Telefonit</label>
                        <input
                          type="text"
                          value={driverForm.phone}
                          onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                          placeholder="+355..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-850 outline-none focus:border-emerald-500/40"
                        />
                      </div>
                    </div>

                    {/* Password Field (Only shown when adding a new driver) */}
                    {!isEditingDriver && (
                      <div className="space-y-1 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Fjalëkalimi i Shoferit (Driver Password)
                        </label>
                        <input
                          type="password"
                          value={driverForm.password}
                          onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                          placeholder="Fjalëkalim i ri për kyçjen e shoferit"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40 mt-1"
                          required={!!driverForm.email}
                        />
                        <p className="text-[9px] text-slate-450 mt-1 italic">
                          *Kjo do të krijojë llogarinë automatikisht në Auth që shoferi të logohet menjëherë.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mjeti / Car</label>
                        <input
                          type="text"
                          value={driverForm.car}
                          onChange={(e) => setDriverForm({ ...driverForm, car: e.target.value })}
                          placeholder="p.sh. BYD Tang"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Targa / Plate</label>
                        <input
                          type="text"
                          value={driverForm.plate}
                          onChange={(e) => setDriverForm({ ...driverForm, plate: e.target.value })}
                          placeholder="p.sh. AB 123 CD"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vlera e Komisionit (%)</label>
                        <input
                          type="number"
                          value={driverForm.commission_value}
                          onChange={(e) => setDriverForm({ ...driverForm, commission_value: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500/40"
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statusi</label>
                        <select
                          value={driverForm.status}
                          onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none"
                        >
                          <option value="Active">Active (Mund të caktohet)</option>
                          <option value="Inactive">Inactive (Nuk mund të caktohet)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingDriver}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3 text-xs tracking-wider uppercase transition shadow-sm mt-3 cursor-pointer"
                    >
                      {isSavingDriver ? "Duke u ruajtur..." : "Ruaj Shoferin"}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-150 pt-4">
              <button
                onClick={() => {
                  setIsDriversModalOpen(false);
                  setIsDriverFormOpen(false);
                }}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 text-xs transition cursor-pointer"
              >
                Mbyll
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ title, value, icon, desc, highlight = false, onClick = null, isZeroed = false }) {
  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 hover:shadow-md transition duration-300 relative ${
        onClick ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-50/5' : ''
      } ${
        highlight 
          ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)] bg-emerald-50/10' 
          : 'border-slate-200/80 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{title}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
            {isZeroed && (
              <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold animate-pulse select-none">
                Zeroed
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-lg">
          {icon}
        </div>
      </div>
      <div className="flex justify-between items-center mt-3">
        <p className="text-[10px] text-slate-400">{desc}</p>
        {onClick && (
          <span className="text-[9px] text-emerald-600 font-bold hover:underline select-none">
            Detaje ➔
          </span>
        )}
      </div>
    </div>
  );
}