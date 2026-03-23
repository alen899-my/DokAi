import Image from "next/image";
import { CustomButton } from "@/components/ui/custom-button";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">

      {/* Full screen background image */}
      <Image
        src="/images/hero/hero.jpg"
        alt="Documenter Hero"
        fill
        priority
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-start text-left px-5 sm:px-8 md:px-12 max-w-5xl mx-auto w-full py-24 sm:py-28 md:py-32">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1.5 sm:px-4 sm:py-2 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full inline-block animate-pulse" />
          AI-Powered Documentation
        </div>

        {/* Headline */}
        <h1 className="font-black text-white text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-none tracking-tighter mb-3 sm:mb-4">
          Document
          <span className="block text-yellow-300">Everything.</span>
          <span className="block text-white">Instantly.</span>
        </h1>

        {/* Divider */}
        <div className="w-16 sm:w-24 h-1 sm:h-1.5 bg-yellow-300 border border-black mb-6 sm:mb-8" />

        {/* Subtext */}
        <p className="text-white/80 text-base sm:text-lg md:text-xl font-medium max-w-xs sm:max-w-sm md:max-w-xl mb-8 sm:mb-10 md:mb-12 leading-relaxed">
          Describe your project — Documenter writes your full technical
          documentation from overview to deployment in seconds. Manual or AI.
          Your choice.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 w-full sm:w-auto">
          <CustomButton
            as="link"
            href="/login"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-9 py-3 sm:py-4"
            iconRight={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            }
          >
            Get Started Free
          </CustomButton>

          <CustomButton
            as="link"
            href="#how-it-works"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-9 py-3 sm:py-4 bg-transparent text-white border-white hover:bg-white hover:text-black"
          >
            Learn More
          </CustomButton>
        </div>

        {/* Fine print */}
        <p className="text-white/40 text-xs mt-6 sm:mt-8 font-medium uppercase tracking-widest">
          No credit card required · Free plan available
        </p>
      </div>

      {/* Corner decorations — smaller on mobile */}
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-yellow-300 border-t-2 border-r-2 border-black opacity-90" />
      <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-black opacity-80" />
    </section>
  );
}