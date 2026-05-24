import { clsx } from "clsx";

export function ScoreRing({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(score);
  const color = rounded >= 80 ? "#0f766e" : rounded >= 65 ? "#b45309" : "#9f1239";
  const dimensions = size === "lg" ? "h-20 w-20 text-xl" : size === "sm" ? "h-12 w-12 text-sm" : "h-16 w-16 text-lg";

  return (
    <div
      className={clsx("grid shrink-0 place-items-center rounded-full font-bold", dimensions)}
      style={{ background: `conic-gradient(${color} ${rounded * 3.6}deg, #e5e7eb 0deg)` }}
      aria-label={`Score ${rounded}`}
    >
      <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-white">{rounded}</div>
    </div>
  );
}
