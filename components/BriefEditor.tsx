"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefData, CAMPAIGN_TYPE_LABELS, CampaignType } from "@/types/brief";
import { getActiveSections } from "@/lib/brief-sections";

interface BriefEditorProps {
  initialData: BriefData;
}

export function BriefEditor({ initialData }: BriefEditorProps) {
  const router = useRouter();
  const [briefData] = useState<BriefData>(initialData);
  const [clientEmail, setClientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const sections = getActiveSections(briefData);

  const handleSend = async () => {
    if (!clientEmail) {
      alert("Add meg az email címed!");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefData, clientEmail }),
      });

      if (!response.ok) throw new Error("Failed to send brief");

      setIsSuccess(true);
    } catch (error) {
      console.error("Error sending brief:", error);
      alert("Hiba történt a brief küldése során. Kérlek, próbáld újra.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);

    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefData }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roi-works-brief-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Hiba történt a PDF letöltése során. Kérlek, próbáld újra.");
    } finally {
      setPdfDownloading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
          {/* Success animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg
                className="w-12 h-12 text-white animate-scale-in"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-black mb-4">
            <span className="text-roi-orange">Köszönjük!</span>
          </h1>
          <p className="text-xl text-roi-gray-light mb-8 leading-relaxed">
            A brief sikeresen elküldve a ROI Works csapatnak.
            <br />
            Hamarosan felvesszük veled a kapcsolatot!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfDownloading ? "PDF letöltés..." : "PDF letöltés"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="btn-secondary text-lg px-8 py-4"
            >
              Új brief indítása
            </button>
          </div>

          {/* Decorative elements */}
          <div className="mt-12 flex justify-center gap-2">
            <div
              className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
              style={{ animationDelay: "100ms" }}
            />
            <div
              className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
              style={{ animationDelay: "200ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-black">
            Brief <span className="text-roi-orange">áttekintése</span>
          </h1>
          <p className="text-sm text-roi-gray-light mt-1">
            Nézd át a brief adatokat, és ha minden rendben, hagyd jóvá és küldd
            el.
          </p>
          {/* Campaign type badges */}
          {briefData.campaign_types && briefData.campaign_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {briefData.campaign_types.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 text-xs font-bold rounded-full bg-roi-orange/20 text-roi-orange"
                >
                  {CAMPAIGN_TYPE_LABELS[type as CampaignType] ?? type}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Dynamic sections */}
          {sections.map((section, idx) => (
            <section
              key={section.title}
              className="card border border-transparent hover:border-roi-gray-light/10 animate-fade-in-up"
              style={{
                animationDelay: `${idx * 0.1}s`,
                opacity: 0,
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-roi-orange">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <span className="block text-[13px] text-roi-gray-light">
                      {field.label}
                    </span>
                    <span className="block text-[13px] text-white">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Email input */}
          <section
            className="card border-2 border-roi-orange animate-fade-in-up relative overflow-hidden"
            style={{
              animationDelay: `${sections.length * 0.1}s`,
              opacity: 0,
            }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-roi-orange/10 rounded-full blur-2xl" />
            <h2 className="text-xl font-bold mb-4 text-roi-orange relative">
              Jóváhagyás
            </h2>
            <div className="mb-4 relative">
              <label className="block text-sm text-roi-gray-light mb-1">
                Add meg az email címed, hogy a ROI Works csapat elérhessen
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@pelda.hu"
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-roi-orange"
              />
            </div>
            <div className="flex flex-col gap-3 relative">
              <button
                onClick={handleSend}
                disabled={isSending || !clientEmail}
                className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending
                  ? "Küldés folyamatban..."
                  : "Jóváhagyás és küldés"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfDownloading}
                className="btn-secondary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfDownloading ? "PDF letöltés..." : "PDF letöltés"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
