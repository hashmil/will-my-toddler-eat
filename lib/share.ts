import type { Prediction } from "./predict";

export function shareLine(r: Prediction) {
  return `Will my toddler eat ${r.food}? ${r.pct}%. ${r.line}`;
}

// Native share sheet on phones, clipboard everywhere else.
export async function share(r: Prediction): Promise<"shared" | "copied" | "failed"> {
  const text = shareLine(r);
  const url = location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Will my toddler eat this?", text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
