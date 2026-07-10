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

export default function BookingWizard() {
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
        console.error("Error prefilling booking wizard profile:", err);
      }
    }
    prefillProfile();
  }, []);

  const customerPhone = `${phonePrefix}${phoneNumber}`.trim();

  const isAirportBooking =
    pickup.toLowerCase().includes("airport") ||
    pickup.toLowerCase().includes("rinas") ||
    pickup.toLowerCase().includes("tia") ||
    dropoff.toLowerCase().includes("airport") ||
    dropoff.toLowerCase().includes("rinas") ||
    dropoff.toLowerCase().includes("tia");

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
        alert("Please enter customer name and phone.");
        return;
      }

      if (!pickupPlace || !dropoffPlace) {
        alert("Please select pickup and drop-off from Google suggestions.");
        return;
      }

      if (isAirportBooking && !flightNumber) {
        alert("Flight number is required for airport bookings.");
        return;
      }
    }

    if (step === 2 && !canStep2) {
      alert("Please select date, time and passengers.");
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
            Book Your Transfer
          </h1>
        </div>

        <span className="rounded-full bg-[#00D084]/20 px-4 py-2 text-sm font-bold text-[#00D084]">
          Step {step}/3
        </span>
      </div>

      {step === 1 && (
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Customer name" value={customerName} onChange={setCustomerName} placeholder="Full name" />

          <div>
            <label className="mb-2 block text-sm font-semibold">Customer phone</label>
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
                placeholder="Phone number"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-[#00D084]"
              />
            </div>
          </div>

          <GooglePlacesInput
            label="Pickup location"
            placeholder="Choose pickup from Google"
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
            label="Drop-off location"
            placeholder="Choose drop-off from Google"
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

          <Input label="Pickup details" value={pickupDetails} onChange={setPickupDetails} placeholder="Gate, terminal, meeting point" />
          <Input label="Drop-off details" value={dropoffDetails} onChange={setDropoffDetails} placeholder="Hotel entrance, apartment, villa" />
          <Input label={isAirportBooking ? "Flight number *" : "Flight number"} value={flightNumber} onChange={setFlightNumber} placeholder="Example: W6 3891" />
          <Input label="Hotel name" value={hotelName} onChange={setHotelName} placeholder="Example: Maritim Hotel Plaza Tirana" />

          {isAirportBooking && !flightNumber && (
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-300 md:col-span-2">
              Flight number is required for airport bookings.
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Date" type="date" value={date} onChange={setDate} />
          <Input label="Time" type="time" value={time} onChange={setTime} />
          <Input label="Passengers" type="number" min="1" value={passengers} onChange={(v) => setPassengers(Number(v))} />
          <Input label="Luggage" type="number" min="0" value={luggage} onChange={(v) => setLuggage(Number(v))} />
        </div>
      )}

      {step === 3 && (
        <div className="rounded-3xl border border-white/15 bg-black/20 p-6">
          <h2 className="mb-5 text-2xl font-black">Booking Summary</h2>

          <div className="grid gap-4 text-sm text-white/85 md:grid-cols-2">
            <Info label="Customer" value={customerName} />
            <Info label="Phone" value={customerPhone} />
            <Info label="Pickup" value={pickup} />
            <Info label="Pickup details" value={pickupDetails} />
            <Info label="Drop-off" value={dropoff} />
            <Info label="Drop-off details" value={dropoffDetails} />
            <Info label="Flight number" value={flightNumber} />
            <Info label="Hotel name" value={hotelName} />
            <Info label="Date" value={date} />
            <Info label="Time" value={time} />
            <Info label="Passengers" value={passengers} />
            <Info label="Luggage" value={luggage} />
            <Info label="Distance" value={routeInfo?.distanceText} />
            <Info label="Duration" value={routeInfo?.durationText} />
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Recommended Transfer Option</p>
            {passengers >= 5 && passengers <= 8 ? (
              <p className="text-[#00D084] font-bold text-xs">
                🚐 1 Mercedes-Benz Vito (Minivan) OR 🚗🚗 2 Electric Taxis
              </p>
            ) : (
              <p className="text-white font-bold text-xs">
                🚗 Toyota bZ4X (Premium Electric Sedan)
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-[#00D084]/15 p-5">
            <p className="text-sm text-white/70">Estimated price</p>
            <p className="mt-1 text-3xl font-black text-[#00D084]">
              {estimatedPrice ? `${estimatedPrice} €` : "Add route"}
            </p>
          </div>

          {/* Privacy Disclaimer Checkbox */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4.5">
            <input
              type="checkbox"
              id="privacy-wizard"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-white/15 bg-slate-900 text-[#00D084] focus:ring-[#00D084] focus:ring-offset-0 focus:outline-none"
            />
            <label htmlFor="privacy-wizard" className="text-xs text-white/75 leading-relaxed cursor-pointer select-none">
              Pranoj Politikën e Privatësisë dhe jap pëlqimin tim për mbledhjen dhe ruajtjen e sigurt të të dhënave të mia për qëllim shërbimi.<br />
              <span className="text-white/45">(I accept the Privacy Policy and consent to the secure collection & storage of my personal data for this transfer service.)</span>
            </label>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-between gap-4">
        <button
          onClick={prevStep}
          disabled={step === 1 || isSaving}
          className="rounded-full border border-white/20 px-8 py-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-30 hover:border-[#00D084] hover:text-[#00D084]"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={nextStep}
            className="rounded-full bg-[#00D084] px-10 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,208,132,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,208,132,0.60)] active:scale-95"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={!canConfirm}
            className="rounded-full bg-[#00D084] px-10 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,208,132,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,208,132,0.60)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Confirm Booking"}
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
        className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-[#00D084]"
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <p>
      <span className="text-white/50">{label}:</span> {value || "-"}
    </p>
  );
}