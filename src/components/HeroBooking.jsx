"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GooglePlacesInput from "./GooglePlacesInput";
import { calculatePrice } from "@/lib/priceCalculator";
import { calculateDistance } from "@/lib/distanceCalculator";
import { supabase } from "@/lib/supabaseClient";

const prefixes = [
  "+355", "+383", "+39", "+49", "+44", "+1", "+30", "+33", "+34", "+41", "+43", "+31", "+32", "+46", "+47", "+45", "+90"
];

export default function HeroBooking() {
  const router = useRouter();
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

  const customerPhone = `${phonePrefix}${phoneNumber}`.trim();

  const isAirportBooking =
    pickup.toLowerCase().includes("airport") ||
    pickup.toLowerCase().includes("rinas") ||
    pickup.toLowerCase().includes("tia") ||
    dropoff.toLowerCase().includes("airport") ||
    dropoff.toLowerCase().includes("rinas") ||
    dropoff.toLowerCase().includes("tia");

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
      ? calculatePrice(routeInfo?.distanceKm || 0, pickup, dropoff) + (babySeat ? 10 : 0)
      : null;

  const canStep1 =
    customerName &&
    phoneNumber &&
    pickupPlace &&
    dropoffPlace &&
    (!isAirportBooking || flightNumber);

  const canStep2 = date && time && passengers > 0;

  const canConfirm = canStep1 && canStep2 && estimatedPrice && !isSaving;

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
        alert("Please enter your name and phone number.");
        return;
      }

      if (!pickupPlace || !dropoffPlace) {
        alert("Please select pickup and destination from autocomplete suggestions.");
        return;
      }

      if (isAirportBooking && !flightNumber) {
        alert("Flight number is required for airport departures/arrivals.");
        return;
      }
    }

    if (step === 2 && !canStep2) {
      alert("Please fill in travel date, time and passenger count.");
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

    const { error } = await supabase.from("bookings").insert([
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
      {/* Sleek Dark Gradient Overlay with Premium Deep Obsidian Tint */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0f19]/96 via-[#0d1527]/90 to-[#101b35]/70" />
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-emerald-500/22 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/18 blur-[155px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-teal-450/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 grid gap-12 lg:grid-cols-12 items-center">
        
        {/* Left Column: Text Content */}
        <div className="lg:col-span-6 text-slate-300 space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4.5 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
            </span>
            Premium Electric Fleet
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-emerald-400 bg-clip-text text-transparent">
            Your Premium <br />
            Airport Transfer <br />
            in Albania
          </h1>

          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            Experience premium private airport transfers from Tirana International Airport (TIA) to any destination in Albania. 100% electric, zero-emission fleet, professional English-speaking drivers, and fully fixed rates.
          </p>

          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm font-medium text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">✓</div> 
              Fixed Rates
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-[#10b981]">✓</div> 
              24/7 Support
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">✓</div> 
              Licensed Drivers
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
                  Online Booking
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-100">Fast Transfer</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 shadow-sm">
                Step {step} of 3
              </span>
            </div>

            {/* Step 1: Locations & Contacts */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Full Name" value={customerName} onChange={setCustomerName} placeholder="Your name" />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">Phone Number</label>
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
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-slate-800/35 bg-slate-950/15 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-950/45 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <GooglePlacesInput
                    label="Pickup Location"
                    placeholder="Search pickup address..."
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
                    label="Drop-off Destination"
                    placeholder="Search drop-off address..."
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
                  <Input label={isAirportBooking ? "Flight Number *" : "Flight Number"} value={flightNumber} onChange={setFlightNumber} placeholder="e.g. W6 3891" />
                  <Input label="Hotel / Accommodation Name" value={hotelName} onChange={setHotelName} placeholder="e.g. Plaza Hotel" />
                </div>
              </div>
            )}

            {/* Step 2: Date, Time, Passengers */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Travel Date" type="date" value={date} onChange={setDate} />
                  <Input label="Pickup Time" type="time" value={time} onChange={setTime} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Passengers" type="number" min="1" value={passengers} onChange={(v) => setPassengers(Number(v))} />
                  <Input label="Luggage Count" type="number" min="0" value={luggage} onChange={(v) => setLuggage(Number(v))} />
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
                    👶 Request Baby / Child Car Seat (+10 €)
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Pickup Details (Optional)" value={pickupDetails} onChange={setPickupDetails} placeholder="e.g. gate, terminal details" />
                  <Input label="Drop-off Details (Optional)" value={dropoffDetails} onChange={setDropoffDetails} placeholder="e.g. hotel lobby, villa door" />
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4.5 space-y-2 text-xs text-slate-400">
                  <h4 className="text-sm font-bold text-slate-200 mb-2 border-b border-slate-800/60 pb-1">Booking Summary</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="text-slate-550">Passenger:</span> {customerName}</p>
                    <p><span className="text-slate-550">Phone:</span> {customerPhone}</p>
                    <p className="col-span-2"><span className="text-slate-550 font-medium">From:</span> {pickup}</p>
                    <p className="col-span-2"><span className="text-slate-550 font-medium">To:</span> {dropoff}</p>
                    <p><span className="text-slate-550">Date:</span> {date}</p>
                    <p><span className="text-slate-550">Time:</span> {time}</p>
                    <p><span className="text-slate-550">Passengers:</span> {passengers}</p>
                    <p><span className="text-slate-550">Luggage:</span> {luggage}</p>
                    {flightNumber && <p><span className="text-slate-550">Flight No:</span> {flightNumber}</p>}
                    {hotelName && <p><span className="text-slate-550">Hotel:</span> {hotelName}</p>}
                    {routeInfo?.distanceText && <p><span className="text-slate-550">Distance:</span> {routeInfo.distanceText}</p>}
                    {routeInfo?.durationText && <p><span className="text-slate-550">Est. Duration:</span> {routeInfo.durationText}</p>}
                    {babySeat && <p className="col-span-2 text-emerald-450 font-bold">👶 Baby Car Seat Requested (+10 €)</p>}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-950/5 border border-emerald-900/15 p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] text-emerald-450 uppercase tracking-wider font-semibold">Estimated Price</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-tight">
                      {estimatedPrice ? `${estimatedPrice} €` : "Calculating..."}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-500 text-right max-w-[170px] leading-relaxed">
                    *Fixed price includes tolls, wait time and luggage. Free cancellation up to 24h prior to pickup.
                  </p>
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
                  Back
                </button>

                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!canConfirm}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white transition duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Confirm Booking"}
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
