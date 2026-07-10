"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const faqsByLang = {
  sq: [
    {
      q: "Sa kushton një taksi nga Aeroporti i Rinasit në qendër të Tiranës?",
      a: "Një transfertë private nga Aeroporti i Rinasit (TIA) në qendër të Tiranës kushton 26 €. Ky është një çmim fiks dhe gjithëpërfshirës. Nuk ka tarifa shtesë për bagazhet, vonesat e fluturimit apo taksat rrugore.",
    },
    {
      q: "Si do ta gjej shoferin tim në aeroport?",
      a: "Shoferi juaj do t'ju presë në sallën e mbërritjeve menjëherë pasi të kaloni doganën, duke mbajtur një tabelë me emrin tuaj. Ne gjithashtu do t'ju dërgojmë të dhënat e shoferit dhe numrin e tij të telefonit me WhatsApp përpara mbërritjes suaj.",
    },
    {
      q: "Çfarë ndodh nëse fluturimi im vonesohet?",
      a: "Ne ndjekim statusin e fluturimeve në kohë reale. Nëse fluturimi juaj vonohet, shoferi do ta dijë dhe do të përshtasë kohën e tij të mbërritjes. Ai do t'ju presë pa asnjë pagesë shtesë.",
    },
    {
      q: "A ofroni ulëse për fëmijë dhe sa kushtojnë ato?",
      a: "Po, ne ofrojmë ulëse fëmijësh dhe rehtues për të gjitha grupmoshat me një tarifë shtesë prej 10 € për ulëse. Thjesht aktivizoni opsionin përkatës në formularin e rezervimit që ta përgatisim për udhëtimin tuaj.",
    },
    {
      q: "Cila është politika juaj e anullimit?",
      a: "Ju mund ta anulloni rezervimin tuaj pa pagesë deri në 24 orë përpara kohës së planifikuar të nisjes. Anullimet e kërkuara më pak se 24 orë përpara nuk pranohen ose nuk rimbursohen.",
    },
    {
      q: "Si mund të paguaj për transfertën?",
      a: "Mund të paguani me para në dorë (Euro ose Lek) direkt te shoferi në fund të udhëtimit. Nëse dëshironi të paguani paraprakisht me kartë krediti ose transfertë bankare, na shkruani në WhatsApp dhe ne do t'ju dërgojmë një link të sigurt pagese.",
    },
  ],
  en: [
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
      a: "You can cancel your booking free of charge up to 24 hours before your scheduled pickup time. Cancellations requested less than 24 hours in advance are not eligible for a refund.",
    },
    {
      q: "How do I pay for the transfer?",
      a: "You can pay in cash (Euros or Albanian Lek) directly to the driver at the end of your trip. If you would like to prepay using a credit card or bank transfer, please message us on WhatsApp and we will send you a secure payment link.",
    },
  ],
  it: [
    {
      q: "Quanto costa un taxi dall'aeroporto di Tirana al centro città?",
      a: "Un trasferimento privato dall'aeroporto internazionale di Tirana (TIA) al centro città costa €26. Questo è un prezzo fisso e tutto compreso. Non ci sono costi aggiuntivi per bagagli, ritardi del volo o pedaggi.",
    },
    {
      q: "Come troverò il mio autista in aeroporto?",
      a: "Il tuo autista ti aspetterà nella sala arrivi subito dopo il passaggio della dogana, con un cartello con il tuo nome. Ti invieremo anche i dettagli dell'autista e il suo numero tramite WhatsApp prima del tuo arrivo.",
    },
    {
      q: "Cosa succede se il mio volo è in ritardo?",
      a: "Monitoriamo tutti i voli in tempo reale. Se il tuo volo è in ritardo, il tuo autista lo saprà e adatterà l'orario di arrivo di conseguenza. Ti aspetterà senza costi aggiuntivi.",
    },
    {
      q: "Offrite seggiolini per bambini e quanto costano?",
      a: "Sì, offriamo seggiolini e rialzi premium per tutte le fasce d'età al costo aggiuntivo di €10 a seggiolino. Basta spuntare la casella nel modulo di prenotazione.",
    },
    {
      q: "Qual è la vostra politica di cancellazione?",
      a: "Puoi cancellare la prenotazione gratuitamente fino a 24 ore prima dell'orario di ritiro previsto. Le cancellazioni richieste con meno di 24 ore di preavviso non sono rimborsabili.",
    },
    {
      q: "Come posso pagare il trasferimento?",
      a: "Puoi pagare in contanti (Euro o Lek albanesi) direttamente all'autista alla fine del viaggio. Se desideri pagare in anticipo con carta di credito, scrivici su WhatsApp per ricevere un link di pagamento sicuro.",
    },
  ],
  de: [
    {
      q: "Wie viel kostet ein Taxi vom Flughafen Tirana ins Stadtzentrum?",
      a: "Ein privater Transfer vom internationalen Flughafen Tirana (TIA) in die Innenstadt kostet 26 €. Dies ist ein All-Inclusive-Festpreis. Es fallen keine zusätzlichen Gebühren für Gepäck, Flugverspätungen oder Mautgebühren an.",
    },
    {
      q: "Wie finde ich meinen Fahrer am Flughafen?",
      a: "Ihr Fahrer erwartet Sie direkt nach dem Zoll in der Ankunftshalle und hält ein Schild mit Ihrem Namen. Wir senden Ihnen vor der Ankunft auch die Daten und die Telefonnummer des Fahrers per WhatsApp.",
    },
    {
      q: "Was passiert, wenn sich mein Flug verspätet?",
      a: "Wir verfolgen alle Flüge in Echtzeit. Bei Flugverspätungen passt der Fahrer seine Ankunftszeit automatisch an. Er wartet ohne Aufpreis auf Sie.",
    },
    {
      q: "Bieten Sie Kindersitze an und wie viel kosten sie?",
      a: "Ja, wir bieten Premium-Babysitze und Sitzerhöhungen für alle Altersgruppen gegen einen Aufpreis von 10 € pro Sitz an. Wählen Sie die Option einfach im Buchungsformular aus.",
    },
    {
      q: "Wie lauten Ihre Stornierungsbedingungen?",
      a: "Sie können Ihre Buchung bis zu 24 Stunden vor der geplanten Abholzeit kostenlos stornieren. Bei Stornierungen unter 24 Stunden erfolgt keine Rückerstattung.",
    },
    {
      q: "Wie bezahle ich den Transfer?",
      a: "Sie können am Ende der Fahrt bar (Euro oder albanische Lek) direkt beim Fahrer bezahlen. Für eine Vorauszahlung per Kreditkarte kontaktieren Sie uns bitte per WhatsApp.",
    },
  ],
  fr: [
    {
      q: "Combien coûte un taxi de l'aéroport de Tirana au centre-ville?",
      a: "Un transfert privé de l'aéroport de Tirana (TIA) au centre-ville coûte 26 €. C'est un tarif fixe tout compris. Aucun supplément pour bagages, retards de vol ou péages.",
    },
    {
      q: "Comment trouver mon chauffeur à l'aéroport?",
      a: "Votre chauffeur vous attendra dans le hall des arrivées juste après la douane, muni d'un panneau à votre nom. Nous vous enverrons également ses coordonnées par WhatsApp avant votre arrivée.",
    },
    {
      q: "Que se passe-t-il si mon vol est retardé?",
      a: "Nous suivons les vols en temps réel. Si votre vol est retardé, le chauffeur adaptera son horaire d'arrivée et vous attendra sans frais supplémentaires.",
    },
    {
      q: "Proposez-vous des sièges enfant et quel est leur coût?",
      a: "Oui, nous proposons des sièges bébé de qualité pour tous les âges moyennant un supplément de 10 € par siège. Il suffit de sélectionner l'option correspondante lors de votre réservation.",
    },
    {
      q: "Quelle est votre politique d'annulation?",
      a: "L'annulation est gratuite jusqu'à 24 heures avant l'heure de prise en charge prévue. Les annulations effectuées moins de 24 heures à l'avance ne sont pas remboursables.",
    },
    {
      q: "Comment puis-je payer le transfert?",
      a: "Vous pouvez payer en espèces (Euros ou Lek albanais) directement au chauffeur à la fin du trajet. Pour un prépaiement par carte, veuillez nous contacter sur WhatsApp.",
    },
  ],
  es: [
    {
      q: "¿Cuánto cuesta un taxi desde el aeropuerto de Tirana al centro de la ciudad?",
      a: "Un traslado privado desde el Aeropuerto de Tirana (TIA) al centro cuesta 26 €. Es un precio fijo con todo incluido. No hay cargos adicionales por equipaje, retrasos o peajes.",
    },
    {
      q: "¿Cómo encontraré a mi conductor en el aeropuerto?",
      a: "Su conductor le esperará en la sala de llegadas tras pasar la aduana, con un cartel con su nombre. Le enviaremos sus datos por WhatsApp antes de su llegada.",
    },
    {
      q: "¿Qué pasa si mi vuelo se retrasa?",
      a: "Monitoreamos los vuelos en tiempo reale. Si su vuelo se retrasa, el conductor ajustará su hora de llegada y le esperará sin coste adicional.",
    },
    {
      q: "¿Ofrecen sillas de niños y cuánto cuestan?",
      a: "Sí, ofrecemos sillas de bebé premium para todas las edades por un cargo adicional de 10 € por silla. Marque la opción en el formulario de reserva.",
    },
    {
      q: "¿Cuál es su política de cancelación?",
      a: "Puede cancelar de forma gratuita hasta 24 horas antes de la recogida. Las cancelaciones solicitadas con menos de 24 horas de antelación no son reembolsables.",
    },
    {
      q: "¿Cómo pago el traslado?",
      a: "Puede pagar en efectivo (Euros o Lek albaneses) al conductor al final del viaje. Para pagar con tarjeta de crédito por adelantado, escríbanos por WhatsApp.",
    },
  ],
};

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  const { language, t } = useLanguage();

  const faqs = faqsByLang[language] || faqsByLang["en"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
          {t("faq")}
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 leading-tight">
          {language === "sq" ? "Çdo Gjë Që Duhet të Dini" : "Everything You Need to Know"}
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          {language === "sq"
            ? "Keni pyetje rreth transfertave tona premium elektrike? Gjeni përgjigjet më poshtë."
            : "Got questions about our premium electric transfers? Find quick answers to the most common queries below."
          }
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
