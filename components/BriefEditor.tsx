"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefData } from "@/types/chat";

interface BriefEditorProps {
  initialData: BriefData;
  onBack: () => void;
}

export function BriefEditor({ initialData, onBack }: BriefEditorProps) {
  const router = useRouter();
  const [briefData, setBriefData] = useState<BriefData>(initialData);
  const [isSending, setIsSending] = useState(false);
  const [clientEmail, setClientEmail] = useState(initialData.company.contact_email || "");
  const [success, setSuccess] = useState(false);

  const updateField = (path: string, value: string | string[]) => {
    setBriefData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      const keys = path.split(".");
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSend = async () => {
    if (!clientEmail) {
      alert("Kérjük, adja meg az email címét!");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefData,
          clientEmail,
        }),
      });

      if (!response.ok) throw new Error("Failed to send brief");

      setSuccess(true);
    } catch (error) {
      console.error("Error sending brief:", error);
      alert("Hiba történt a brief küldése során. Kérjük, próbálja újra.");
    } finally {
      setIsSending(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black mb-4">
            Brief <span className="text-roi-orange">elküldve!</span>
          </h1>
          <p className="text-roi-gray-light mb-8">
            A kampány brief sikeresen elküldve a megadott email címekre.
            Hamarosan felvesszük Önnel a kapcsolatot.
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Új brief indítása
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">
              Brief <span className="text-roi-orange">ellenőrzés</span>
            </h1>
            <p className="text-sm text-roi-gray-light">
              Ellenőrizze és szükség esetén módosítsa az adatokat
            </p>
          </div>
          <button onClick={onBack} className="btn-secondary text-sm">
            Vissza a chathez
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Cégadatok</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Cégnév</label>
                <input
                  type="text"
                  value={briefData.company.name}
                  onChange={(e) => updateField("company.name", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kapcsolattartó neve</label>
                <input
                  type="text"
                  value={briefData.company.contact_name}
                  onChange={(e) => updateField("company.contact_name", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Email</label>
                <input
                  type="email"
                  value={briefData.company.contact_email}
                  onChange={(e) => {
                    updateField("company.contact_email", e.target.value);
                    setClientEmail(e.target.value);
                  }}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Telefon</label>
                <input
                  type="tel"
                  value={briefData.company.contact_phone}
                  onChange={(e) => updateField("company.contact_phone", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
            </div>
          </section>

          {/* Campaign Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Kampány</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kampány neve</label>
                  <input
                    type="text"
                    value={briefData.campaign.name}
                    onChange={(e) => updateField("campaign.name", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kampány típusa</label>
                  <input
                    type="text"
                    value={briefData.campaign.type}
                    onChange={(e) => updateField("campaign.type", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kampány célja</label>
                <textarea
                  value={briefData.campaign.goal}
                  onChange={(e) => updateField("campaign.goal", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kampány üzenete</label>
                <textarea
                  value={briefData.campaign.message}
                  onChange={(e) => updateField("campaign.message", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">KPI-k (vesszővel elválasztva)</label>
                <input
                  type="text"
                  value={briefData.campaign.kpis.join(", ")}
                  onChange={(e) => updateField("campaign.kpis", e.target.value.split(",").map((s) => s.trim()))}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
            </div>
          </section>

          {/* Target Audience Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Célcsoport</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Nem</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.gender}
                    onChange={(e) => updateField("target_audience.demographics.gender", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kor</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.age}
                    onChange={(e) => updateField("target_audience.demographics.age", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Földrajzi hely</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.location}
                    onChange={(e) => updateField("target_audience.demographics.location", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Pszichográfia</label>
                <textarea
                  value={briefData.target_audience.psychographics}
                  onChange={(e) => updateField("target_audience.psychographics", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Persona</label>
                <textarea
                  value={briefData.target_audience.persona}
                  onChange={(e) => updateField("target_audience.persona", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-roi-orange"
                />
              </div>
            </div>
          </section>

          {/* Channels Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Csatornák</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Hirdetési csatornák (vesszővel elválasztva)</label>
              <input
                type="text"
                value={briefData.channels.join(", ")}
                onChange={(e) => updateField("channels", e.target.value.split(",").map((s) => s.trim()))}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
              />
            </div>
          </section>

          {/* Timeline Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Időzítés</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kezdés</label>
                <input
                  type="text"
                  value={briefData.timeline.start}
                  onChange={(e) => updateField("timeline.start", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Befejezés</label>
                <input
                  type="text"
                  value={briefData.timeline.end}
                  onChange={(e) => updateField("timeline.end", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
                />
              </div>
            </div>
          </section>

          {/* Budget Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Költségvetés</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Teljes büdzsé</label>
              <input
                type="text"
                value={briefData.budget.total}
                onChange={(e) => updateField("budget.total", e.target.value)}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
              />
            </div>
          </section>

          {/* Competitors Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Versenytársak</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Versenytársak (vesszővel elválasztva)</label>
              <input
                type="text"
                value={briefData.competitors.join(", ")}
                onChange={(e) => updateField("competitors", e.target.value.split(",").map((s) => s.trim()))}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
              />
            </div>
          </section>

          {/* Notes Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Megjegyzések</h2>
            <textarea
              value={briefData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-roi-orange"
            />
          </section>

          {/* Email for sending */}
          <section className="card border-2 border-roi-orange">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Küldés</h2>
            <div className="mb-4">
              <label className="block text-sm text-roi-gray-light mb-1">
                Az Ön email címe (ide küldjük a brief másolatát)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@pelda.hu"
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isSending || !clientEmail}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Küldés folyamatban..." : "Brief elküldése"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
