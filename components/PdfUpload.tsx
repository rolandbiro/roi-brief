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
  const [isProcessing, setIsProcessing] = useState(false);

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

      setIsProcessing(true);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setTimeout(() => {
          setIsProcessing(false);
          onFileSelected(file, base64);
        }, 300); // Small delay for visual feedback
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
    <div className="w-full max-w-xl mx-auto animate-fade-in-up stagger-2">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64",
          "border-2 border-dashed rounded-2xl cursor-pointer",
          "transition-all duration-300 ease-out overflow-hidden group",
          isDragging && "border-roi-orange bg-roi-orange/10 scale-[1.02]",
          !isDragging && !fileName && "border-roi-gray-light/30 hover:border-roi-orange/50 hover:bg-roi-gray-darker/50",
          fileName && !isProcessing && "border-green-500 bg-green-500/10",
          isProcessing && "border-roi-orange bg-roi-orange/5"
        )}
      >
        {/* Background glow effect on drag */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          "bg-gradient-to-br from-roi-orange/5 to-transparent",
          isDragging ? "opacity-100" : "opacity-0"
        )} />

        <div className="relative flex flex-col items-center justify-center pt-5 pb-6 px-4">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 mb-4 border-4 border-roi-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-roi-orange">Feldolgozás...</p>
            </>
          ) : fileName ? (
            <>
              <div className="relative mb-4">
                <svg
                  className="w-14 h-14 text-green-500 animate-scale-in"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-500 mb-1">{fileName}</p>
              <p className="text-sm text-roi-gray-light">
                Kattintson ide másik fájl választásához
              </p>
            </>
          ) : (
            <>
              {/* Upload icon with animation */}
              <div className="relative mb-4">
                <div className={cn(
                  "absolute inset-0 bg-roi-orange/20 rounded-full blur-xl transition-all duration-300",
                  isDragging ? "scale-150 opacity-100" : "scale-100 opacity-0 group-hover:opacity-50"
                )} />
                <svg
                  className={cn(
                    "relative w-14 h-14 text-roi-orange transition-all duration-300",
                    isDragging ? "scale-110" : "group-hover:scale-110"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="mb-2 text-lg text-center">
                <span className="font-semibold text-roi-orange">
                  Kattintson a feltöltéshez
                </span>{" "}
                <span className="text-roi-gray-light">vagy húzza ide a fájlt</span>
              </p>
              <p className="text-sm text-roi-gray-light/70">
                PDF formátum • Max. 10MB
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

      {/* Error message with animation */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in">
          <p className="text-center text-red-400 text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
