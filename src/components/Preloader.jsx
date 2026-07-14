"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenPreloader");
    if (hasSeen === "true") {
      return;
    }

    // Lock page scroll during animation
    document.body.style.overflow = "hidden";
    setVisible(true);

    // Backup timer to trigger fadeout after 9.5s in case video loads slowly or gets stuck
    const timer = setTimeout(() => {
      triggerFadeout();
    }, 9500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, []);

  const triggerFadeout = () => {
    setFade(true);
    // Allow 1s fade-out transition to complete before unmounting and restoring scroll
    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "unset";
      sessionStorage.setItem("hasSeenPreloader", "true");
    }, 1000);
  };

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#07110f] transition-opacity duration-1000 ease-out ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <video
        src="/logo-animation.mp4"
        autoPlay
        muted
        playsInline
        onEnded={triggerFadeout}
        className="w-full max-w-[650px] h-auto object-contain px-6"
      />
    </div>
  );
}
