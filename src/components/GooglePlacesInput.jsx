"use client";

import { useEffect, useId, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

export default function GooglePlacesInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const listenerRef = useRef(null);

  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);

  const isSelectingRef = useRef(false);
  const uniqueId = useId();

  /*
   * Ruajmë versionin më të fundit të funksioneve,
   * pa krijuar përsëri Google Autocomplete.
   */
  useEffect(() => {
    onChangeRef.current = onChange;
    onSelectRef.current = onSelect;
  }, [onChange, onSelect]);

  /*
   * Sinkronizon input-in vetëm kur vlera ndryshon
   * nga komponenti prind.
   *
   * Input-i nuk përdor value={value}, sepse Google Places
   * duhet të ketë mundësi ta ndryshojë vetë DOM-in.
   */
  useEffect(() => {
    if (!inputRef.current || isSelectingRef.current) return;

    const nextValue = value || "";

    if (inputRef.current.value !== nextValue) {
      inputRef.current.value = nextValue;
    }
  }, [value]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAutocomplete() {
      try {
        await loadGoogleMaps();

        if (
          !isMounted ||
          !inputRef.current ||
          !window.google?.maps?.places
        ) {
          return;
        }

        /*
         * Mbron komponentin nga inicializimi më shumë se një herë.
         */
        if (autocompleteRef.current) return;

        const autocomplete =
          new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: {
              country: "al",
            },
            fields: [
              "formatted_address",
              "geometry",
              "name",
              "types",
              "place_id",
            ],
          });

        autocompleteRef.current = autocomplete;

        listenerRef.current = autocomplete.addListener(
          "place_changed",
          () => {
            const place = autocomplete.getPlace();

            if (!place?.geometry?.location) {
              const typedValue = inputRef.current?.value || "";

              onChangeRef.current?.(typedValue, false);
              onSelectRef.current?.(null);

              return;
            }

            isSelectingRef.current = true;

            /*
             * formatted_address është më i qëndrueshëm se vlera
             * e përkohshme që Google shkruan në input gjatë klikimit.
             */
            const finalAddress =
              place.formatted_address ||
              place.name ||
              inputRef.current?.value ||
              "";

            if (inputRef.current) {
              inputRef.current.value = finalAddress;
            }

            const selectedPlace = {
              address: finalAddress,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.name || "",
              types: place.types || [],
              placeId: place.place_id || "",
            };

            onChangeRef.current?.(finalAddress, true);
            onSelectRef.current?.(selectedPlace);

            /*
             * Lejojmë të mbarojnë eventet që Google gjeneron
             * pas klikimit me maus.
             */
            window.setTimeout(() => {
              isSelectingRef.current = false;
            }, 250);
          }
        );
      } catch (error) {
        console.error("Google Places initialization error:", error);
      }
    }

    initializeAutocomplete();

    return () => {
      isMounted = false;

      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }

      autocompleteRef.current = null;
    };
  }, []);

  const handleInput = (event) => {
    if (isSelectingRef.current) return;

    const typedValue = event.currentTarget.value;

    onChangeRef.current?.(typedValue, false);
  };

  return (
    <div>
      <label
        htmlFor={uniqueId}
        className="mb-1.5 block text-xs font-semibold text-slate-400"
      >
        {label}
      </label>

      <input
        ref={inputRef}
        id={uniqueId}
        name={`location-${uniqueId}`}
        type="text"
        defaultValue={value || ""}
        autoComplete="off"
        spellCheck="false"
        onInput={handleInput}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800/35 bg-slate-950/15 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-slate-950/45"
      />
    </div>
  );
}