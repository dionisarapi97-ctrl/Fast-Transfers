import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      to,
      bookingId,
      customerName,
      customerPhone,
      pickup,
      pickupDetails,
      dropoff,
      dropoffDetails,
      date,
      time,
      price,
      passengers,
      luggage,
      flightNumber,
      hotelName,
      distance,
      duration,
      status,
      type,
    } = body;

    // Check if SMTP environment variables are set. If not, bypass to avoid breaking the UI.
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn("SMTP credentials (SMTP_USER, SMTP_PASS) not configured. Email bypassed.");
      return NextResponse.json({ success: true, bypassed: true });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || user;

    if (type === "creation") {
      // 1. Send detailed email to Admin
      const adminSubject = `🚖 REZERVIM I RI: ${bookingId} - ${customerName}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em;">🚖 REZERVIM I RI KRYER</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Booking ID: ${bookingId}</p>
          </div>
          <div style="padding: 24px; line-height: 1.6;">
            <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 2px solid #10b981; padding-bottom: 6px; text-transform: uppercase;">Detajet e Klientit</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 120px;">Emri:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Telefoni:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">
                  <a href="tel:${customerPhone}" style="color: #10b981; text-decoration: none;">${customerPhone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Email:</td>
                <td style="padding: 6px 0; color: #0f172a;">${to || "Nuk ka email"}</td>
              </tr>
            </table>
            
            <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 2px solid #10b981; padding-bottom: 6px; text-transform: uppercase;">Detajet e Transfertës</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">Nisja (From):</td>
                <td style="padding: 6px 0; color: #0f172a;">
                  <strong>${pickup}</strong>
                  ${pickupDetails ? `<br><span style="color: #64748b; font-size: 12px;">Detaje: ${pickupDetails}</span>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Mbërritja (To):</td>
                <td style="padding: 6px 0; color: #0f172a;">
                  <strong>${dropoff}</strong>
                  ${dropoffDetails ? `<br><span style="color: #64748b; font-size: 12px;">Detaje: ${dropoffDetails}</span>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Data & Koha:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${date} në orën ${time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Pasagjerë:</td>
                <td style="padding: 6px 0; color: #0f172a;">${passengers || 1} udhëtar(ë) / ${luggage || 0} bagazh(e)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Fluturimi:</td>
                <td style="padding: 6px 0; color: #0f172a;">${flightNumber || "—"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Hoteli:</td>
                <td style="padding: 6px 0; color: #0f172a;">${hotelName || "—"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Distanca / Koha:</td>
                <td style="padding: 6px 0; color: #0f172a;">${distance || "—"} / ${duration || "—"}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b; font-size: 15px;">Çmimi:</td>
                <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #10b981;">${price} €</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            Fast Transfers Operations Management · Support: fasttransfers.booking@gmail.com
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Fast Transfers" <${user}>`,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
      });

      // 2. Send email to customer (if provided)
      if (to && to.trim() !== "") {
        const customerSubject = `Fast Transfers - Booking Received (${bookingId})`;
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #10b981; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; tracking: 0.05em;">🚖 FAST TRANSFERS</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Udhëtoni me stil dhe siguri</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
              <p style="font-size: 16px; margin-top: 0;">Përshëndetje <strong>${customerName}</strong>,</p>
              <p>Faleminderit që zgjodhët Fast Transfers! Rezervimi juaj sapo u pranua nga sistemi ynë si porosi dhe është në pritje të konfirmimit.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Përmbledhja e Rezervimit</h3>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 120px;">Booking ID:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Nisja (From):</td>
                    <td style="padding: 4px 0;">${pickup} ${pickupDetails ? `(${pickupDetails})` : ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Mbërritja (To):</td>
                    <td style="padding: 4px 0;">${dropoff} ${dropoffDetails ? `(${dropoffDetails})` : ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Data & Koha:</td>
                    <td style="padding: 4px 0;">${date} në orën ${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Udhëtarë / Bagazhe:</td>
                    <td style="padding: 4px 0;">${passengers || 1} pasagjerë / ${luggage || 0} bagazh(e)</td>
                  </tr>
                  ${flightNumber ? `<tr><td style="padding: 4px 0; color: #64748b;">Fluturimi:</td><td style="padding: 4px 0;">${flightNumber}</td></tr>` : ""}
                  ${hotelName ? `<tr><td style="padding: 4px 0; color: #64748b;">Hoteli:</td><td style="padding: 4px 0;">${hotelName}</td></tr>` : ""}
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Çmimi (Price):</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #10b981;">${price} €</td>
                  </tr>
                </table>
              </div>

              <p style="margin-bottom: 0;">Do të lajmëroheni me një email tjetër sapo transferta juaj të konfirmohet dhe shoferi të caktohet.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              Fast Transfers &copy; 2026 · Support: fasttransfers.booking@gmail.com
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Fast Transfers" <${user}>`,
          to: to,
          subject: customerSubject,
          html: customerHtml,
        });
      }
    } else if (type === "status_update") {
      let subject = "";
      let html = "";

      if (status === "Confirmed") {
        subject = `Fast Transfers - Booking Confirmed (${bookingId}) 🎉`;
        html = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #10b981; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800;">🎉 CONFIRMED!</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Rezervimi juaj u konfirmua</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
              <p style="font-size: 16px; margin-top: 0;">Përshëndetje <strong>${customerName}</strong>,</p>
              <p>Kemi kënaqësinë t'ju njoftojmë se udhëtimi juaj me Fast Transfers **u konfirmua me sukses**! Shoferi ynë do t'ju presë në vendin dhe kohën e caktuar.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 120px;">Booking ID:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Nisja (From):</td>
                    <td style="padding: 4px 0;">${pickup}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Mbërritja (To):</td>
                    <td style="padding: 4px 0;">${dropoff}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Data & Koha:</td>
                    <td style="padding: 4px 0;">${date} në orën ${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Statusi (Status):</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #10b981;">Konfirmuar / Confirmed</td>
                  </tr>
                </table>
              </div>

              <p>Detajet e shoferit do t'ju dërgohen gjithashtu në WhatsApp përpara nisjes. Faleminderit që zgjodhët shërbimin tonë!</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              Fast Transfers &copy; 2026 · Support: fasttransfers.booking@gmail.com
            </div>
          </div>
        `;
      } else if (status === "Cancelled") {
        subject = `Fast Transfers - Booking Cancelled (${bookingId})`;
        html = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #ef4444; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800;">🚫 CANCELLED</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Rezervimi juaj u anullua</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
              <p style="font-size: 16px; margin-top: 0;">Përshëndetje <strong>${customerName}</strong>,</p>
              <p>Ju njoftojmë se rezervimi juaj me numër ID <strong>${bookingId}</strong> është anulluar në sistemin tonë.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 120px;">Booking ID:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Nisja (From):</td>
                    <td style="padding: 4px 0;">${pickup}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Mbërritja (To):</td>
                    <td style="padding: 4px 0;">${dropoff}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Statusi (Status):</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #ef4444;">Anulluar / Cancelled</td>
                  </tr>
                </table>
              </div>

              <p>Nëse ky anullim u bë gabimisht ose dëshironi të bëni një rezervim të ri, ju lutemi kryeni një aplikim të ri në faqen tonë ose na shkruani në WhatsApp.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              Fast Transfers &copy; 2026 · Support: fasttransfers.booking@gmail.com
            </div>
          </div>
        `;
      }

      if (subject && html && to && to.trim() !== "") {
        await transporter.sendMail({
          from: `"Fast Transfers" <${user}>`,
          to,
          subject,
          html,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email via API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
