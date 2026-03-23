const stats = [
  { value: "12+",     label: "Doc Sections"       },
  { value: "2 Modes", label: "Manual + AI"         },
  { value: "100%",    label: "Free to start"       },
  { value: "1 File",  label: "Editable HTML output"},
];

export default function StatsStrip() {
  return (
    <section className="border-y-2 border-black bg-yellow-300 py-5">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center text-center pr-6 last:pr-0 ${
              i !== stats.length - 1 ? "border-r-2 border-black" : ""
            }`}
          >
            <span className="font-black text-3xl md:text-4xl tracking-tight text-black">
              {stat.value}
            </span>
            <span className="font-bold text-xs text-black/70 mt-1 uppercase tracking-widest">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}