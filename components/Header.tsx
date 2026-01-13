import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-roi-gray-dark/95 backdrop-blur-sm border-b border-roi-gray-darker">
      <div className="container mx-auto px-6 py-4">
        <Logo className="h-10 text-white" />
      </div>
    </header>
  );
}
