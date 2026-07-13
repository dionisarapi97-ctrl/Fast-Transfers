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

export default function HeroBooking() {
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
  const [babySeat, setBabySeat] = useState(false);

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
        console.error("Error prefilling hero booking profile:", err);
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

  // Listen to autofill-booking event from popular destinations
  useEffect(() => {
    const handleAutofill = (e) => {
      if (e.detail) {
        if (e.detail.pickup) {
          setPickup(e.detail.pickup);
          setPickupPlace({ address: e.detail.pickup });
        }
        if (e.detail.dropoff) {
          setDropoff(e.detail.dropoff);
          setDropoffPlace({ address: e.detail.dropoff });
        }
        setStep(1);
      }
    };

    window.addEventListener("autofill-booking", handleAutofill);
    return () => window.removeEventListener("autofill-booking", handleAutofill);
  }, []);

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
      ? calculatePrice(routeInfo?.distanceKm || 0, pickup, dropoff, passengers) + (babySeat ? 10 : 0)
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
        alert(language === "sq" ? "Ju lutem zgjidhni vendin e nisjes dhe mbërritjes nga sugjerimet." : "Please select pickup and destination from autocomplete suggestions.");
        return;
      }
      if (isAirportBooking && !flightNumber) {
        alert(language === "sq" ? "Numri i fluturimit kërkohet për udhëtimet nga/drejt aeroportit." : "Flight number is required for airport departures/arrivals.");
        return;
      }
    }

    if (step === 2 && !canStep2) {
      alert(language === "sq" ? "Ju lutem plotësoni datën, orën dhe numrin e pasagjerëve." : "Please fill in travel date, time and passenger count.");
      return;
    }

    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmBooking = async () => {
    if (!canConfirm) {
      alert("Please fill in all booking details.");
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
        pickup_details: babySeat ? `${pickupDetails} (Need Baby Car Seat)`.trim() : pickupDetails,
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
          pickup_details: babySeat ? `${pickupDetails} (Need Baby Car Seat)`.trim() : pickupDetails,
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
    <section className="relative min-h-[95vh] flex items-center pt-28 pb-20 overflow-hidden bg-[#0b0f19]">
      {/* Background Hero Image */}
      <img
        src="/images/fast-transfers-hero.jpg"
        alt="Fast Transfers Premium Airport Taxi"
        className="absolute inset-0 h-full w-full object-cover object-center scale-105"
      />
      {/* Sleek Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0f19]/96 via-[#0d1527]/90 to-[#101b35]/70" />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-emerald-500/22 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/18 blur-[155px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 grid gap-12 lg:grid-cols-12 items-center">

        {/* Left Column: Text Content */}
        <div className="lg:col-span-6 text-slate-300 space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4.5 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
            </span>
            {t("hero_badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-emerald-400 bg-clip-text text-transparent">
            {language === "sq" ? (
              <>Transferta Premium <br />nga Aeroporti <br />në Shqipëri</>
            ) : language === "it" ? (
              <>Trasferimenti Premium <br />dall'Aeroporto <br />in Albania</>
            ) : language === "de" ? (
              <>Premium-Flughafen- <br />transfer <br />in Albanien</>
            ) : language === "fr" ? (
              <>Transferts Aéroport <br />Premium <br />en Albanie</>
            ) : language === "es" ? (
              <>Traslados Premium <br />de Aeropuerto <br />en Albania</>
            ) : (
              <>Premium Airport <br />Transfers <br />in Albania</>
            )}
          </h1>

          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            {t("hero_subtitle")}
          </p>

          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm font-medium text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">✓</div>
              {t("fixed_rates")}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-[#10b981]">✓</div>
              {t("support_247")}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">✓</div>
              {t("licensed_drivers")}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Form */}
        <div className="lg:col-span-6 w-full flex lg:justify-end" id="booking-card">
          <div className="w-full max-w-[520px] rounded-[32px] border border-slate-800/35 bg-slate-950/15 p-6 md:p-8 text-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/20">

            {/* Form Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-850/40 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-450">
                  {t("online_booking")}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-100">{t("fast_transfer")}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 shadow-sm">
                {t("step_of", { step, total: 3 })}
              </span>
            </div>

            {/* Step 1: Locations & Contacts */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={t("full_name")} value={customerName} onChange={setCustomerName} placeholder={t("placeholder_name")} />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">{t("phone_number")}</label>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="rounded-xl border border-slate-800/35 bg-slate-950/15 px-2 py-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50 cursor-pointer"
                      >
                        {prefixes.map((p) => (
                          <option key={p} value={p} className="bg-[#0b0f19] text-white">
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={t("placeholder_phone")}
                        className="w-full rounded-xl border border-slate-800/35 bg-slate-950/15 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-950/45 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={isAirportBooking ? `${t("flight_number")} *` : t("flight_number")} value={flightNumber} onChange={setFlightNumber} placeholder={t("placeholder_flight")} />
                  <Input label={t("hotel_name")} value={hotelName} onChange={setHotelName} placeholder={t("placeholder_hotel")} />
                </div>
              </div>
            )}

            {/* Step 2: Date, Time, Passengers */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={t("travel_date")} type="date" value={date} onChange={setDate} />
                  <Input label={t("travel_time")} type="time" value={time} onChange={setTime} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={t("passengers")} type="number" min="1" value={passengers} onChange={(v) => setPassengers(Number(v))} />
                  <Input label={t("luggage")} type="number" min="0" value={luggage} onChange={(v) => setLuggage(Number(v))} />
                </div>
                <div className="flex items-center gap-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/35 hover:border-emerald-500/25 transition">
                  <input
                    type="checkbox"
                    id="babySeat"
                    checked={babySeat}
                    onChange={(e) => setBabySeat(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer rounded bg-slate-950/40 border-slate-800"
                  />
                  <label htmlFor="babySeat" className="text-xs font-semibold text-slate-350 cursor-pointer select-none">
                    👶 {t("baby_seat")}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={t("pickup_details")} value={pickupDetails} onChange={setPickupDetails} placeholder="e.g. gate, terminal details" />
                  <Input label={t("dropoff_details")} value={dropoffDetails} onChange={setDropoffDetails} placeholder="e.g. hotel lobby, villa door" />
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4.5 space-y-2 text-xs text-slate-400">
                  <h4 className="text-sm font-bold text-slate-200 mb-2 border-b border-slate-800/60 pb-1">{t("booking_summary")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="text-slate-550">{t("summary_passenger")}:</span> {customerName}</p>
                    <p><span className="text-slate-550">{t("summary_phone")}:</span> {customerPhone}</p>
                    <p className="col-span-2"><span className="text-slate-550 font-medium">{t("summary_from")}:</span> {pickup}</p>
                    <p className="col-span-2"><span className="text-slate-550 font-medium">{t("summary_to")}:</span> {dropoff}</p>
                    <p><span className="text-slate-550">{t("summary_date")}:</span> {date}</p>
                    <p><span className="text-slate-550">{t("summary_time")}:</span> {time}</p>
                    <p><span className="text-slate-550">{t("summary_passengers")}:</span> {passengers}</p>
                    <p><span className="text-slate-550">{t("summary_luggage")}:</span> {luggage}</p>
                    {flightNumber && <p><span className="text-slate-550">{t("flight_number")}:</span> {flightNumber}</p>}
                    {hotelName && <p><span className="text-slate-550">{t("hotel_name")}:</span> {hotelName}</p>}
                    {routeInfo?.distanceText && <p><span className="text-slate-550">{t("summary_distance")}:</span> {routeInfo.distanceText}</p>}
                    {routeInfo?.durationText && <p><span className="text-slate-550">{t("summary_duration")}:</span> {routeInfo.durationText}</p>}
                    {babySeat && <p className="col-span-2 text-emerald-450 font-bold">👶 {t("baby_seat")}</p>}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-950/5 border border-emerald-900/15 p-4 flex flex-col gap-3.5 shadow-sm">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="text-[10px] text-emerald-455 uppercase tracking-wider font-semibold">{t("est_price")}</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tight">
                        {estimatedPrice ? `${estimatedPrice} €` : "..."}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500 text-right max-w-[170px] leading-relaxed">
                      {language === "sq" 
                        ? "*Çmimi fiks përfshin taksat rrugore, kohën e pritjes dhe bagazhet. Anullim falas deri në 24 orë para marrjes."
                        : "*Fixed price includes tolls, wait time and luggage. Free cancellation up to 24h prior to pickup."
                      }
                    </p>
                  </div>
                  {estimatedPrice && (
                    <a
                      href={`https://wa.me/355693048000?text=${encodeURIComponent(
                        language === "sq"
                          ? `Përshëndetje! Dua të negocioj një çmim më të mirë për rezervimin tim:\nNisja: ${pickup}\nMbërritja: ${dropoff}\nDistanca: ${routeInfo?.distanceText || ""}\nUdhëtarë: ${passengers}\nÇmimi i parashikuar: ${estimatedPrice} €`
                          : `Hi! I want to negotiate a better price for my transfer booking:\nFrom: ${pickup}\nTo: ${dropoff}\nDistance: ${routeInfo?.distanceText || ""}\nPassengers: ${passengers}\nEstimated Price: ${estimatedPrice} €`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 py-2.5 text-xs font-bold text-emerald-450 hover:text-emerald-400 transition-all active:scale-95 duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current text-emerald-450" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.62.962 3.21 1.48 4.887 1.481 5.423 0 9.837-4.414 9.84-9.84.002-2.623-1.01-5.086-2.855-6.936C16.678 3.86 14.238 2.855 11.622 2.855c-5.42 0-9.833 4.414-9.836 9.84-.001 1.79.479 3.534 1.39 5.097l-.951 3.473 3.565-.935zm12.59-7.291c-.3-.149-1.777-.878-2.047-.978-.27-.099-.467-.149-.662.149-.195.298-.753.978-.923 1.177-.17.199-.34.224-.64.075-.3-.15-1.265-.467-2.41-1.487-.89-.795-1.49-1.77-1.665-2.07-.175-.3-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.298.3-.497.1-.198.05-.372-.025-.521-.075-.149-.662-1.593-.907-2.189-.238-.574-.48-.497-.662-.506-.17-.008-.365-.01-.56-.01s-.514.074-.783.372c-.269.299-1.025 1.002-1.025 2.443 0 1.441 1.049 2.83 1.194 3.029.145.198 2.062 3.149 4.995 4.417.697.302 1.24.482 1.66.617.7.222 1.338.19 1.843.115.564-.084 1.778-.727 2.028-1.43.25-.702.25-1.303.175-1.43-.075-.127-.27-.201-.57-.35z" />
                      </svg>
                      {language === "sq" ? "Negocio Çmimin në WhatsApp" : "Negotiate Price on WhatsApp"}
                    </a>
                  )}
                </div>

                {/* Privacy Disclaimer Checkbox */}
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-800/35 bg-slate-950/15 p-3.5 shadow-sm">
                  <input
                    type="checkbox"
                    id="privacy-hero"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer rounded bg-slate-950/40 border-slate-850"
                  />
                  <label htmlFor="privacy-hero" className="text-[10px] text-slate-400 leading-relaxed cursor-pointer select-none">
                    {t("privacy_disclaimer")}
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-850/40 pt-4">
              <div className="flex justify-between w-full gap-3">
                <button
                  onClick={prevStep}
                  disabled={step === 1 || isSaving}
                  className="rounded-xl border border-slate-800/35 bg-slate-950/15 px-5 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-slate-950/25 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t("back")}
                </button>

                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer"
                  >
                    {t("continue")}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!canConfirm}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving ? "..." : t("confirm_booking")}
                  </button>
                )}
              </div>

              {step === 3 && (
                <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                  ⚠️ Rezervimi mund të anullohet pa pagesë vetëm deri në 24 orë para kohës së nisjes.<br />
                  (Cancellations are free only up to 24 hours prior to pickup time.)
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", min }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800/35 bg-slate-950/15 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-650 focus:border-emerald-500/50 focus:bg-slate-950/45 transition"
      />
    </div>
  );
}
