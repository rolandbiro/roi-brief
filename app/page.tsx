"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleContinue = () => {
    if (acceptedPrivacy) {
      router.push("/brief");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Hero Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Kampány <span className="text-roi-orange">Brief</span>
            </h1>
            <p className="text-lg md:text-xl text-roi-gray-light mb-10 leading-relaxed">
              AI asszisztensünk segít összeállítani a tökéletes kampány briefet
              -- válaszoljon néhány kérdésre, és mi elkészítjük.
            </p>
          </div>

          {/* Value Proposition - 3 steps */}
          <div className="grid md:grid-cols-3 gap-5 mb-10 text-left">
            <div className="card card-hover border border-transparent animate-fade-in-up stagger-1 group">
              <div className="w-12 h-12 bg-roi-orange/20 rounded-xl flex items-center justify-center mb-4
                            group-hover:bg-roi-orange/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-roi-orange text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-roi-orange transition-colors">Kérdezünk</h3>
              <p className="text-roi-gray-light text-sm leading-relaxed">
                AI asszisztensünk személyre szabott kérdésekkel feltárja a kampány igényeit.
              </p>
            </div>
            <div className="card card-hover border border-transparent animate-fade-in-up stagger-2 group">
              <div className="w-12 h-12 bg-roi-orange/20 rounded-xl flex items-center justify-center mb-4
                            group-hover:bg-roi-orange/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-roi-orange text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-roi-orange transition-colors">Összeállítjuk</h3>
              <p className="text-roi-gray-light text-sm leading-relaxed">
                A válaszok alapján professzionális kampány brief készül automatikusan.
              </p>
            </div>
            <div className="card card-hover border border-transparent animate-fade-in-up stagger-3 group">
              <div className="w-12 h-12 bg-roi-orange/20 rounded-xl flex items-center justify-center mb-4
                            group-hover:bg-roi-orange/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-roi-orange text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-roi-orange transition-colors">Elindulunk</h3>
              <p className="text-roi-gray-light text-sm leading-relaxed">
                A kész brief alapján a ROI Works csapata azonnal dolgozni tud.
              </p>
            </div>
          </div>

          {/* Privacy Consent Card */}
          <div
            className={`
              relative overflow-hidden rounded-2xl mb-8 transition-all duration-500 ease-out
              ${acceptedPrivacy
                ? 'bg-roi-gray-darker/50 border border-roi-orange/20'
                : 'bg-gradient-to-br from-roi-gray-darker to-roi-gray-darker/80 border border-roi-gray-light/10'
              }
            `}
          >
            {/* Subtle corner accent */}
            <div className={`
              absolute -top-12 -right-12 w-32 h-32 rounded-full transition-all duration-500
              ${acceptedPrivacy ? 'bg-roi-orange/10' : 'bg-roi-orange/5'}
            `} />

            <label className="relative flex items-center gap-4 p-5 cursor-pointer group">
              {/* Custom Checkbox */}
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`
                  w-6 h-6 rounded-lg border-2 transition-all duration-300 ease-out
                  flex items-center justify-center
                  ${acceptedPrivacy
                    ? 'bg-roi-orange border-roi-orange scale-110'
                    : 'border-roi-gray-light/40 group-hover:border-roi-orange/60 group-hover:scale-105'
                  }
                `}>
                  <svg
                    className={`w-4 h-4 text-black transition-all duration-300 ${acceptedPrivacy ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Shield Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                ${acceptedPrivacy ? 'bg-roi-orange/20' : 'bg-roi-gray-light/5 group-hover:bg-roi-orange/10'}
              `}>
                <svg
                  className={`w-5 h-5 transition-colors duration-300 ${acceptedPrivacy ? 'text-roi-orange' : 'text-roi-gray-light/60 group-hover:text-roi-orange/80'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="flex-1 text-left">
                <span className={`
                  text-sm font-medium transition-colors duration-300
                  ${acceptedPrivacy ? 'text-white' : 'text-roi-gray-light group-hover:text-white'}
                `}>
                  Elfogadom az{" "}
                  <a
                    href="https://roi.works/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-roi-orange hover:text-roi-orange-80 underline underline-offset-2 decoration-roi-orange/40 hover:decoration-roi-orange transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Adatkezelési Tájékoztatót
                  </a>
                </span>
                <p className={`
                  text-xs mt-1 transition-colors duration-300
                  ${acceptedPrivacy ? 'text-roi-gray-light/80' : 'text-roi-gray-light/50'}
                `}>
                  Az adatait biztonságosan kezeljük és harmadik félnek nem adjuk ki.
                </p>
              </div>

              {/* Status indicator */}
              <div className={`
                flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
                ${acceptedPrivacy
                  ? 'bg-roi-orange/20 text-roi-orange'
                  : 'bg-roi-gray-light/10 text-roi-gray-light/50'
                }
              `}>
                {acceptedPrivacy ? 'Elfogadva' : 'Szükséges'}
              </div>
            </label>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            disabled={!acceptedPrivacy}
            className={`
              btn-primary text-lg px-10 py-4 transition-all duration-300
              ${acceptedPrivacy
                ? 'opacity-100 translate-y-0'
                : 'opacity-50 cursor-not-allowed'
              }
            `}
          >
            Chat indítása
          </button>
        </div>
      </div>
    </div>
  );
}
