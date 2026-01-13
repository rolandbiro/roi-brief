import { BriefData } from "@/types/chat";

export function generateEmailHtml(data: BriefData): string {
  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kampány Brief - ${data.campaign.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #2A2B2E; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
                ROI <span style="color: #FF6400;">WORKS</span>
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #E3E3E3;">
                Kampány Brief • ${today}
              </p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 2px solid #FF6400;">
              <h2 style="margin: 0; font-size: 22px; color: #2A2B2E;">
                ${data.campaign.name}
              </h2>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #3C3E43;">
                ${data.campaign.type}
              </p>
            </td>
          </tr>

          <!-- Company Section -->
          <tr>
            <td style="padding: 25px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Cégadatok
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 120px;">Cégnév:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.company.name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Kapcsolattartó:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.company.contact_name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Email:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">
                    <a href="mailto:${data.company.contact_email}" style="color: #0022D2;">${data.company.contact_email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Telefon:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.company.contact_phone}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Campaign Section -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Kampány részletek
              </h3>
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #2A2B2E;">
                <strong style="color: #3C3E43;">Cél:</strong> ${data.campaign.goal}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #2A2B2E;">
                <strong style="color: #3C3E43;">Üzenet:</strong> ${data.campaign.message}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 13px; color: #3C3E43;">
                <strong>KPI-k:</strong>
              </p>
              <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 13px; color: #2A2B2E;">
                ${data.campaign.kpis.map((kpi) => `<li style="margin-bottom: 3px;">${kpi}</li>`).join("")}
              </ul>
            </td>
          </tr>

          <!-- Target Audience Section -->
          <tr>
            <td style="padding: 25px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Célcsoport
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 120px;">Nem:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.target_audience.demographics.gender}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Kor:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.target_audience.demographics.age}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Földrajzi hely:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.target_audience.demographics.location}</td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #2A2B2E;">
                <strong style="color: #3C3E43;">Pszichográfia:</strong> ${data.target_audience.psychographics}
              </p>
              <p style="margin: 0; font-size: 13px; color: #2A2B2E;">
                <strong style="color: #3C3E43;">Persona:</strong> ${data.target_audience.persona}
              </p>
            </td>
          </tr>

          <!-- Channels & Timeline Section -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Csatornák és Időzítés
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 120px;">Csatornák:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.channels.join(", ")}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Kezdés:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.timeline.start}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Befejezés:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.timeline.end}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Budget & Competitors Section -->
          <tr>
            <td style="padding: 25px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Költségvetés és Versenytársak
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 120px;">Büdzsé:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px; font-weight: bold;">${data.budget.total}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #3C3E43; font-size: 13px;">Versenytársak:</td>
                  <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${data.competitors.join(", ")}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            data.notes
              ? `
          <!-- Notes Section -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
                Megjegyzések
              </h3>
              <p style="margin: 0; font-size: 13px; color: #2A2B2E; line-height: 1.6;">
                ${data.notes}
              </p>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="background-color: #2A2B2E; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #E3E3E3;">
                Ez a brief a ROI Works AI asszisztensével készült.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #3C3E43;">
                © ${new Date().getFullYear()} ROI Works. Minden jog fenntartva.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
