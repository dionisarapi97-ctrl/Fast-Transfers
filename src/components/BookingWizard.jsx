"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GooglePlacesInput from "./GooglePlacesInput";
import { calculatePrice } from "@/lib/priceCalculator";
import { calculateDistance } from "@/lib/distanceCalculator";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

const prefixes = [
  "+355", "+383", "+39", "+49", "+44", "+1", "+30", "+33", "+34", "+41", "+43", "+31", "+32", "+46", "+47", "+45", "+90"
];

export default function BookingWizard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+355");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropoffPlace, setDropoffPlace] = useState(null);

  const [pickupDetails, setPickupDetails] = useState("");
  const [dropoffDetails, setDropoffDetails] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [hotelName, setHotelName] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);

  const [routeInfo, setRouteInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    async function prefillProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCustomerEmail(session.user.email);
          setCustomerName(session.user.user_metadata?.full_name || "");
          const phone = session.user.user_metadata?.phone || "";
          if (phone) {
            const matchedPrefix = prefixes.find(p => phone.startsWith(p));
            if (matchedPrefix) {
              setPhonePrefix(matchedPrefix);
              setPhoneNumber(phone.substring(matchedPrefix.length));
            } else {
              setPhoneNumber(phone);
            }
          }
        }
      } catch (err) {
        console.error("Error prefilling wizard profile:", err);
      }
    }
    prefillProfile();
  }, []);

  const customerPhone = `${phonePrefix}${phoneNumber}`.trim();

  const isAirportBooking =
    pickup.toLowerCase().includes("airport") ||
    pickup.toLowerCase().includes("rinas") ||
    /\btia\b/i.test(pickup) ||
    dropoff.toLowerCase().includes("airport") ||
    dropoff.toLowerCase().includes("rinas") ||
    /\btia\b/i.test(dropoff);

  useEffect(() => {
    async function getRoute() {
      if (!pickupPlace || !dropoffPlace) {
        setRouteInfo(null);
        return;
      }

      const info = await calculateDistance(pickup, dropoff);
      setRouteInfo(info);
    }

    getRoute();
  }, [pickup, dropoff, pickupPlace, dropoffPlace]);

  const estimatedPrice =
    pickupPlace && dropoffPlace
      ? calculatePrice(routeInfo?.distanceKm || 0, pickup, dropoff, passengers)
      : null;

  const canStep1 =
    customerName &&
    phoneNumber &&
    pickupPlace &&
    dropoffPlace &&
    (!isAirportBooking || flightNumber);

  const canStep2 = date && time && passengers > 0;

  const canConfirm = canStep1 && canStep2 && estimatedPrice && acceptPrivacy && !isSaving;

  const generateBookingId = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FT-${y}${m}${day}-${random}`;
  };

  const nextStep = () => {
    if (step === 1 && !canStep1) {
      if (!customerName || !phoneNumber) {
        alert(language === "sq" ? "Ju lutem shkruani emrin dhe numrin tuaj të telefonit." : "Please enter your name and phone number.");
        return;
      }

      if (!pickupPlace || !dropoffPlace) {
        alert(language === "sq" ? "Ju lutem zgjidhni vendin e nisjes dhe mbërritjes nga sugjerimet." : "Please select pickup and drop-off from Google suggestions.");
        return;
      }

      if (isAirportBooking && !flightNumber) {
        alert(language === "sq" ? "Numri i fluturimit kërkohet për udhëtimet nga/drejt aeroportit." : "Flight number is required for airport bookings.");
        return;
      }
    }

    if (step === 2 && !canStep2) {
      alert(language === "sq" ? "Ju lutem plotësoni datën, orën dhe numrin e pasagjerëve." : "Please select date, time and passengers.");
      return;
    }

    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmBooking = async () => {
    if (!canConfirm) {
      alert("Please complete all booking details.");
      return;
    }

    setIsSaving(true);

    const bookingId = generateBookingId();

    let { error } = await supabase.from("bookings").insert([
      {
        booking_id: bookingId,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup,
        dropoff,
        pickup_details: pickupDetails,
        dropoff_details: dropoffDetails,
        flight_number: flightNumber,
        hotel_name: hotelName,
        distance: routeInfo?.distanceKm || null,
        duration: routeInfo?.durationText || null,
        price: estimatedPrice,
        total_price: estimatedPrice,
        passengers,
        luggage,
        travel_date: date,
        travel_time: time,
        status: "Pending",
        customer_email: customerEmail || null,
      },
    ]);

    // Fallback if customer_email column does not exist in db schema yet
    if (error && (error.message.includes("customer_email") || error.code === "PGRST204" || error.details?.includes("customer_email"))) {
      console.warn("customer_email column not found in schema. Retrying insert without it.");
      const fallbackResult = await supabase.from("bookings").insert([
        {
          booking_id: bookingId,
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup,
          dropoff,
          pickup_details: pickupDetails,
          dropoff_details: dropoffDetails,
          flight_number: flightNumber,
          hotel_name: hotelName,
          distance: routeInfo?.distanceKm || null,
          duration: routeInfo?.durationText || null,
          price: estimatedPrice,
          total_price: estimatedPrice,
          passengers,
          luggage,
          travel_date: date,
          travel_time: time,
          status: "Pending",
        },
      ]);
      error = fallbackResult.error;
    }

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "creation",
          bookingId,
          customerName,
          customerPhone,
          to: customerEmail || null,
          pickup,
          pickupDetails,
          dropoff,
          dropoffDetails,
          date,
          time,
          price: estimatedPrice,
          passengers,
          luggage,
          flightNumber,
          hotelName,
          distance: routeInfo?.distanceText || null,
          duration: routeInfo?.durationText || null,
        }),
      });
    } catch (emailErr) {
      console.error("Error triggering reservation email:", emailErr);
    }

    router.push(`/booking/success?id=${bookingId}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00D084]">
            Fast Transfers
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            {language === "sq" ? "Rezervo Udhëtimin Tënd" : "Book Your Transfer"}
          </h1>
        </div>

        <span className="rounded-full bg-[#00D084]/20 px-4 py-2 text-sm font-bold text-[#00D084]">
          {t("step_of", { step, total: 3 })}
        </span>
      </div>

      {step === 1 && (
        <div className="grid gap-5 md:grid-cols-2">
          <Input label={t("full_name")} value={customerName} onChange={setCustomerName} placeholder={t("placeholder_name")} />

          <div>
            <label className="mb-2 block text-sm font-semibold">{t("phone_number")}</label>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-white outline-none focus:border-[#00D084]"
              >
                {prefixes.map((p) => (
                  <option key={p} value={p} className="bg-[#07110f]">
                    {p}
                  </option>
                ))}
              </select>

              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t("placeholder_phone")}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-[#00D084]"
              />
            </div>
          </div>

          <Input
            label={language === "sq" ? `${t("email_label")} (Opsionale)` : `${t("email_label")} (Optional)`}
            type="email"
            value={customerEmail}
            onChange={setCustomerEmail}
            placeholder="example@email.com"
          />

          <GooglePlacesInput
            label={t("pickup_location")}
            placeholder={t("placeholder_pickup")}
            value={pickup}
            onChange={(value, fromGoogle) => {
              setPickup(value);
              if (!fromGoogle) setPickupPlace(null);
            }}
            onSelect={(place) => {
              setPickup(place.address);
              setPickupPlace(place);
            }}
          />

          <GooglePlacesInput
            label={t("dropoff_destination")}
            placeholder={t("placeholder_dropoff")}
            value={dropoff}
            onChange={(value, fromGoogle) => {
              setDropoff(value);
              if (!fromGoogle) setDropoffPlace(null);
            }}
            onSelect={(place) => {
              setDropoff(place.address);
              setDropoffPlace(place);
            }}
          />

          <Input label={t("pickup_details")} value={pickupDetails} onChange={setPickupDetails} placeholder="Gate, terminal, meeting point" />
          <Input label={t("dropoff_details")} value={dropoffDetails} onChange={setDropoffDetails} placeholder="Hotel entrance, apartment, villa" />
          <Input label={isAirportBooking ? `${t("flight_number")} *` : t("flight_number")} value={flightNumber} onChange={setFlightNumber} placeholder={t("placeholder_flight")} />
          <Input label={t("hotel_name")} value={hotelName} onChange={setHotelName} placeholder={t("placeholder_hotel")} />

          {isAirportBooking && !flightNumber && (
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-300 md:col-span-2">
              {language === "sq" ? "Numri i fluturimit kërkohet për rezervimet e aeroportit." : "Flight number is required for airport bookings."}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5 md:grid-cols-2">
          <Input label={t("travel_date")} type="date" value={date} onChange={setDate} />
          <Input label={t("travel_time")} type="time" value={time} onChange={setTime} />
          <Input label={t("passengers")} type="number" min="1" value={passengers} onChange={(v) => setPassengers(Number(v))} />
          <Input label={t("luggage")} type="number" min="0" value={luggage} onChange={(v) => setLuggage(Number(v))} />
        </div>
      )}

      {step === 3 && (
        <div className="rounded-3xl border border-white/15 bg-black/20 p-6">
          <h2 className="mb-5 text-2xl font-black">{t("booking_summary")}</h2>

          <div className="grid gap-4 text-sm text-white/85 md:grid-cols-2">
            <Info label={t("summary_passenger")} value={customerName} />
            <Info label={t("summary_phone")} value={customerPhone} />
            <Info label={t("summary_from")} value={pickup} />
            <Info label={t("pickup_details")} value={pickupDetails} />
            <Info label={t("summary_to")} value={dropoff} />
            <Info label={t("dropoff_details")} value={dropoffDetails} />
            <Info label={t("flight_number")} value={flightNumber} />
            <Info label={t("hotel_name")} value={hotelName} />
            <Info label={t("summary_date")} value={date} />
            <Info label={t("summary_time")} value={time} />
            <Info label={t("summary_passengers")} value={passengers} />
            <Info label={t("summary_luggage")} value={luggage} />
            <Info label={t("summary_distance")} value={routeInfo?.distanceText} />
            <Info label={t("summary_duration")} value={routeInfo?.durationText} />
          </div>

          <div className="mt-8 flex flex-col justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white/60">{t("est_price")}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
                <p className="text-4xl font-black text-[#00D084]">
                  {estimatedPrice ? `${estimatedPrice} €` : "..."}
                </p>
                {estimatedPrice && (
                  <a
                    href={`https://wa.me/355693048000?text=${encodeURIComponent(
                      language === "sq"
                        ? `Përshëndetje! Dua të negocioj një çmim më të mirë për rezervimin tim:\nNisja: ${pickup}\nMbërritja: ${dropoff}\nDistanca: ${routeInfo?.distanceText || ""}\nUdhëtarë: ${passengers}\nÇmimi i parashikuar: ${estimatedPrice} €`
                        : `Hi! I want to negotiate a better price for my transfer booking:\nFrom: ${pickup}\nTo: ${dropoff}\nDistance: ${routeInfo?.distanceText || ""}\nPassengers: ${passengers}\nEstimated Price: ${estimatedPrice} €`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-450 hover:text-emerald-400 transition-all active:scale-95 duration-200 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current text-emerald-450" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.62.962 3.21 1.48 4.887 1.481 5.423 0 9.837-4.414 9.84-9.84.002-2.623-1.01-5.086-2.855-6.936C16.678 3.86 14.238 2.855 11.622 2.855c-5.42 0-9.833 4.414-9.836 9.84-.001 1.79.479 3.534 1.39 5.097l-.951 3.473 3.565-.935zm12.59-7.291c-.3-.149-1.777-.878-2.047-.978-.27-.099-.467-.149-.662.149-.195.298-.753.978-.923 1.177-.17.199-.34.224-.64.075-.3-.15-1.265-.467-2.41-1.487-.89-.795-1.49-1.77-1.665-2.07-.175-.3-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.298.3-.497.1-.198.05-.372-.025-.521-.075-.149-.662-1.593-.907-2.189-.238-.574-.48-.497-.662-.506-.17-.008-.365-.01-.56-.01s-.514.074-.783.372c-.269.299-1.025 1.002-1.025 2.443 0 1.441 1.049 2.83 1.194 3.029.145.198 2.062 3.149 4.995 4.417.697.302 1.24.482 1.66.617.7.222 1.338.19 1.843.115.564-.084 1.778-.727 2.028-1.43.25-.702.25-1.303.175-1.43-.075-.127-.27-.201-.57-.35z" />
                    </svg>
                    {language === "sq" ? "Negocio Çmimin" : "Negotiate Price"}
                  </a>
                )}
              </div>
            </div>
            
            <p className="text-xs text-white/40 max-w-xs leading-relaxed sm:text-right">
              {language === "sq" 
                ? "*Çmimi fiks përfshin të gjitha taksat, pritjet dhe bagazhet. Anullim falas deri në 24 orë para nisjes."
                : "*Fixed price includes all tolls, wait time and luggage. Free cancellation up to 24h prior to pickup."
              }
            </p>
          </div>

          {/* Privacy Disclaimer Checkbox */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/15 bg-[#07110f]/45 p-4 shadow-sm">
            <input
              type="checkbox"
              id="privacy-wizard"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="w-5 h-5 accent-[#00D084] cursor-pointer rounded bg-[#07110f]/40 border-white/15"
            />
            <label htmlFor="privacy-wizard" className="text-xs text-white/60 leading-relaxed cursor-pointer select-none">
              {t("privacy_disclaimer")}
            </label>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-4 border-t border-white/10 pt-8">
        <button
          onClick={prevStep}
          disabled={step === 1 || isSaving}
          className="rounded-2xl border border-white/15 px-6 py-4 text-sm font-bold text-white/60 transition hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          {t("back")}
        </button>

        {step < 3 ? (
          <button
            onClick={nextStep}
            className="rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 cursor-pointer"
          >
            {t("continue")}
          </button>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={!canConfirm}
            className="rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? "..." : t("confirm_booking")}
          </button>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", min }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-[#00D084] focus:bg-white/15 transition"
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="text-xs text-white/40 block font-semibold uppercase">{label}</span>
      <span className="mt-1 block font-bold text-white text-sm">{value || "—"}</span>
    </div>
  );
}