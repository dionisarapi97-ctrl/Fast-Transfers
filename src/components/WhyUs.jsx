"use client";

export default function WhyUs() {
  const features = [
    {
      icon: "⚡",
      title: "100% Electric Fleet",
      desc: "Travel in modern electric vehicles for absolute comfort and zero environmental impact.",
    },
    {
      icon: "🏷️",
      title: "Fixed Fares",
      desc: "No hidden costs or dynamic surcharges. The price quoted is exactly what you pay.",
    },
    {
      icon: "🕒",
      title: "24/7 Availability",
      desc: "We are available 24 hours a day, 7 days a week, regardless of your flight arrival time.",
    },
    {
      icon: "✈️",
      title: "Live Flight Tracking",
      desc: "We monitor your flight status in real time. If you are delayed, we wait for you free of charge.",
    },
    {
      icon: "👤",
      title: "Professional Drivers",
      desc: "Licensed, polite, English-speaking professional drivers who are happy to assist with luggage.",
    },
    {
      icon: "👶",
      title: "Free Child Seats",
      desc: "Your child's safety is our priority. We offer clean, standard child seats free of charge.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
          Why Choose Us
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 leading-tight">
          Eco-Friendly & Reliable Transfers
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          We provide the highest standard of private transportation in Albania, combining state-of-the-art electric vehicles with exceptional passenger hospitality.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex gap-5 p-7 rounded-3xl border border-slate-800/80 bg-slate-900/20 hover:border-emerald-500/20 transition duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.25)]"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-2xl shadow-sm">
              {f.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200 tracking-wide">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
