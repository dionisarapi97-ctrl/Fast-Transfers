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
              <p className="text-4xl font-black text-[#00D084]">
                {estimatedPrice ? `${estimatedPrice} €` : "..."}
              </p>
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