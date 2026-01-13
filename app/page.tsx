"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PdfUpload } from "@/components/PdfUpload";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);

  const handleFileSelected = (selectedFile: File, base64: string) => {
    setFile({ name: selectedFile.name, base64 });
    // Store in sessionStorage for the chat page
    sessionStorage.setItem("proposalPdf", JSON.stringify({ name: selectedFile.name, base64 }));
  };

  const handleContinue = () => {
    if (file) {
      router.push("/brief");
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-6">
          Kampány <span className="text-roi-orange">Brief</span>
        </h1>
        <p className="text-xl text-roi-gray-light mb-12">
          Üdvözöljük a ROI Works brief rendszerben! Töltse fel az elfogadott
          ajánlatot, és AI asszisztensünk segít összeállítani a kampány briefet.
        </p>

        <PdfUpload onFileSelected={handleFileSelected} />

        <div className="mt-8">
          <button
            onClick={handleContinue}
            disabled={!file}
            className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tovább a brief kitöltéshez
          </button>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Feltöltés</h3>
            <p className="text-roi-gray-light text-sm">
              Töltse fel az elfogadott ajánlatot PDF formátumban.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Kitöltés</h3>
            <p className="text-roi-gray-light text-sm">
              AI asszisztensünk végigvezeti a brief kérdéseken.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Küldés</h3>
            <p className="text-roi-gray-light text-sm">
              Ellenőrizze és küldje el a kész briefet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
