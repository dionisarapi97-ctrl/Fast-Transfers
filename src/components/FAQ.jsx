"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "How much does a taxi from Tirana Airport to the city center cost?",
      a: "A private transfer from Tirana International Airport (TIA) to Tirana city center costs €26. This is a fixed, all-inclusive price. There are no additional charges for luggage, flight delays, or tolls.",
    },
    {
      q: "How will I find my driver at the airport?",
      a: "Your driver will be waiting for you in the arrivals hall immediately after you pass through customs, holding a board with your name. We will also send you the driver's details and phone number via WhatsApp prior to your arrival.",
    },
    {
      q: "What happens if my flight is delayed?",
      a: "We track all flights in real time. If your flight is delayed, your driver will know and will adjust their arrival time accordingly. They will wait for you with no extra charge.",
    },
    {
      q: "Do you offer child seats and how much do they cost?",
      a: "Yes, we offer premium baby seats and booster seats for all age groups for an additional charge of €10 per seat. Simply check the 'Request Baby / Child Car Seat' option in the booking form so we can prepare it for your ride.",
    },
    {
      q: "What is your cancellation policy?",
      a: "You can cancel your booking free of charge up to 24 hours before your scheduled pickup time. Cancellations requested less than 24 hours in advance are not allowed or may not be eligible for a refund.",
    },
    {
      q: "How do I pay for the transfer?",
      a: "You can pay in cash (Euros or Albanian Lek) directly to the driver at the end of your trip. If you would like to prepay using a credit card or bank transfer, please message us on WhatsApp and we will send you a secure payment link.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
          FAQ
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 leading-tight">
          Everything You Need to Know
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Got questions about our premium electric transfers? Find quick answers to the most common queries below.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/15 overflow-hidden transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.2)] hover:border-emerald-500/25"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex justify-between items-center px-6 py-5 text-left text-slate-200 font-semibold hover:bg-slate-900/30 transition duration-200 cursor-pointer"
              >
                <span className="text-sm md:text-base">{faq.q}</span>
                <span className="text-emerald-500 text-xl font-bold transition-transform duration-300">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[250px] border-t border-slate-800/60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 py-5 text-xs md:text-sm text-slate-400 leading-relaxed bg-slate-950/40">
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
