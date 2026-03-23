import { CustomButton } from "@/components/ui/custom-button";

const steps = [
  {
    num:   "01",
    title: "Describe Your Project",
    desc:  "Fill in structured forms for each section — or just write a single description and let AI handle the rest.",
    color: "bg-yellow-300",
  },
  {
    num:   "02",
    title: "AI Writes Everything",
    desc:  "Overview, database schema, API routes, deployment guide — all generated and streamed live in seconds.",
    color: "bg-black text-white",
  },
  {
    num:   "03",
    title: "Edit & Export",
    desc:  "Every section is editable directly in your browser. Download as a single beautiful HTML file when done.",
    color: "bg-white",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-b-2 border-black py-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Section heading */}
        <div className="mb-16">
          <div className="inline-block bg-black text-yellow-300 font-black text-xs uppercase tracking-widest px-4 py-2 mb-4">
            How it works
          </div>
          <h2 className="font-black text-5xl md:text-6xl tracking-tighter leading-none">
            Three steps.
            <span className="block text-gray-400">That's it.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`
                ${step.color}
                border-2 border-black p-10
                ${i !== 0 ? "-ml-0.5" : ""}
                shadow-[6px_6px_0px_0px_#000]
                hover:shadow-[8px_8px_0px_0px_#000]
                hover:-translate-x-0.5 hover:-translate-y-0.5
                transition-all duration-100
              `}
            >
              <div
                className={`font-black text-6xl mb-6 ${
                  step.color === "bg-black text-white"
                    ? "text-yellow-300"
                    : "text-black/20"
                }`}
              >
                {step.num}
              </div>
              <h3
                className={`font-black text-xl mb-3 tracking-tight ${
                  step.color === "bg-black text-white" ? "text-white" : "text-black"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`font-medium text-sm leading-relaxed ${
                  step.color === "bg-black text-white"
                    ? "text-white/70"
                    : "text-black/60"
                }`}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 flex justify-center">
          <CustomButton as="link" href="/app" variant="primary" size="xl">
            Start Documenting Now
          </CustomButton>
        </div>
      </div>
    </section>
  );
}