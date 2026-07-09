"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

export default function GooglePlacesInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    let autocomplete;

    loadGoogleMaps().then(() => {
      if (!inputRef.current || !window.google) return;

      autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "al" },
          fields: ["formatted_address", "geometry", "name", "types"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        const finalAddress =
          place.formatted_address || place.name || inputRef.current.value;

        const selectedPlace = {
          address: finalAddress,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          name: place.name || "",
          types: place.types || [],
        };

        onChange(finalAddress, true);
        onSelect(selectedPlace);
      });
    });

    return () => {
      if (autocomplete && window.google) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [onChange, onSelect]);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">
        {label}
      </label>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value, false)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800/35 bg-slate-950/15 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-655 focus:border-emerald-500/50 focus:bg-slate-950/45 transition"
      />
    </div>
  );
}