export const runtime = "nodejs";

const manifestoLines = [
  "Garments arrive without fanfare and leave without warning.",
  "Every look is rendered in private—no mirrors, no fluorescent confessionals.",
  "You are the stylist, the model, the proof.",
  "We measure success by images worth keeping, not inventory churn.",
  "If you are here, you were invited. Keep it quiet."
];

export default function ManifestoPage() {
  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-3xl px-4 py-24 space-y-12">
        <h1 className="font-mono text-sm lowercase tracking-[0.6em]">closet.city</h1>
        <div className="space-y-6 text-sm leading-relaxed text-black/75">
          {manifestoLines.map((line) => (
            <p key={line} className="font-serif text-lg leading-relaxed text-black">
              {line}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
