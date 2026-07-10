"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function WhyUs() {
  const { t } = useLanguage();

  const features = [
    {
      icon: "⚡",
      title: t("why_feat1_title"),
      desc: t("why_feat1_desc"),
    },
    {
      icon: "🏷️",
      title: t("why_feat2_title"),
      desc: t("why_feat2_desc"),
    },
    {
      icon: "🕒",
      title: t("why_feat3_title"),
      desc: t("why_feat3_desc"),
    },
    {
      icon: "✈️",
      title: t("why_feat4_title"),
      desc: t("why_feat4_desc"),
    },
    {
      icon: "👤",
      title: t("why_feat5_title"),
      desc: t("why_feat5_desc"),
    },
    {
      icon: "👶",
      title: t("why_feat6_title"),
      desc: t("why_feat6_desc"),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
          {t("why_us")}
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 leading-tight">
          {t("why_title")}
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          {t("why_sub")}
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
