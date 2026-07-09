"use client";

import Navbar from "../../components/Navbar";
import BookingWizard from "../../components/BookingWizard";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      <Navbar />

      <section className="px-6 pt-36 md:px-14 md:pt-44">
        <BookingWizard />
      </section>
    </main>
  );
}