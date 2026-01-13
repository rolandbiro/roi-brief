import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function BriefLoading() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-roi-gray-light">Brief oldal betöltése...</p>
      </div>
    </div>
  );
}
