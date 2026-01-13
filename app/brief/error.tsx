"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BriefError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Brief page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-4">
          Hiba <span className="text-red-500">történt</span>
        </h1>
        <p className="text-roi-gray-light mb-8">
          Sajnáljuk, hiba történt az oldal betöltése során. Kérjük, próbálja újra.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Újrapróbálás
          </button>
          <Link href="/" className="btn-secondary">
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
