"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefData, CAMPAIGN_TYPE_LABELS, CampaignType } from "@/types/brief";
import {
  getActiveSections,
  getNestedValue,
  hasValue,
} from "@/lib/brief-sections";

const BADGE_FIELDS = new Set([
  "campaign_types",
  "ad_channels",
  "kpis",
  "creative_source",
  "creative_types",
  "gender",
]);

interface BriefEditorProps {
  initialData: BriefData;
  onBackToChat: () => void;
}

export function BriefEditor({ initialData, onBackToChat }: BriefEditorProps) {
  const router = useRouter();
  const [briefData] = useState<BriefData>(initialData);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const sections = getActiveSections(briefData);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefData }),
      });
      if (!response.ok) throw new Error("Approval failed");
      setIsApproved(true);
    } catch (error) {
      console.error("Error approving brief:", error);
      alert("Hiba történt a jóváhagyás során. Kérlek, próbáld újra.");
      setIsApproving(false);
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

  if (isApproved) {
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
            A briefet sikeresen rögzítettük. A ROI Works projekt menedzser
            hamarosan felveszi Veled a kapcsolatot az ajánlat részleteivel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfDownloading ? "PDF letöltés..." : "PDF letöltése"}
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black">
                Brief <span className="text-roi-orange">áttekintése</span>
              </h1>
              <p className="text-sm text-roi-gray-light mt-1">
                Nézd át az összegyűjtött adatokat. Ha minden rendben van, hagyd
                jóvá a briefet.
              </p>
            </div>
            <button
              onClick={onBackToChat}
              className="btn-secondary text-sm flex-shrink-0"
            >
              Vissza a chatbe
            </button>
          </div>
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
                {section.fields.map((field) => {
                  const rawValue = getNestedValue(
                    briefData as unknown as Record<string, unknown>,
                    field.key
                  );
                  const isBadgeField =
                    BADGE_FIELDS.has(field.key) &&
                    Array.isArray(rawValue) &&
                    hasValue(rawValue);

                  return (
                    <div key={field.label}>
                      <span className="block text-[13px] text-roi-gray-light">
                        {field.label}
                      </span>
                      {isBadgeField ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(rawValue as string[]).map((item) => (
                            <span
                              key={item}
                              className="px-3 py-1 text-[13px] rounded-full bg-roi-orange/20 text-white"
                            >
                              {field.key === "campaign_types"
                                ? (CAMPAIGN_TYPE_LABELS[
                                    item as CampaignType
                                  ] ?? item)
                                : item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="block text-[13px] text-white">
                          {field.value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Approval block */}
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
            <p className="text-sm text-roi-gray-light mb-4 relative">
              Ha az adatok rendben vannak, a Jóváhagyom gombbal véglegesítheted
              a briefet.
            </p>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {isApproving ? "Feldolgozás..." : "Jóváhagyom"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
