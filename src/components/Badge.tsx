import { clsx } from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "gold" | "blue";
};

const tones = {
  neutral: "border-slate-200 bg-white text-slate-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  gold: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-cyan-200 bg-cyan-50 text-cyan-800"
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={clsx("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
