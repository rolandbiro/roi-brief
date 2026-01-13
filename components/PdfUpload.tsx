"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onFileSelected: (file: File, base64: string) => void;
}

export function PdfUpload({ onFileSelected }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.type !== "application/pdf") {
        setError("Csak PDF fájlokat fogadunk el.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("A fájl mérete nem haladhatja meg a 10MB-ot.");
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        onFileSelected(file, base64);
      };
      reader.readAsDataURL(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragging
            ? "border-roi-orange bg-roi-orange/10"
            : "border-roi-gray-light/30 hover:border-roi-orange/50 hover:bg-roi-gray-darker/50",
          fileName && "border-green-500 bg-green-500/10"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {fileName ? (
            <>
              <svg
                className="w-12 h-12 mb-4 text-green-500"
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
              <p className="text-lg font-medium text-green-500">{fileName}</p>
              <p className="text-sm text-roi-gray-light mt-2">
                Kattintson ide másik fájl választásához
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mb-4 text-roi-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-lg">
                <span className="font-semibold text-roi-orange">
                  Kattintson a feltöltéshez
                </span>{" "}
                vagy húzza ide a fájlt
              </p>
              <p className="text-sm text-roi-gray-light">
                PDF formátum (max. 10MB)
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
        />
      </label>
      {error && (
        <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
