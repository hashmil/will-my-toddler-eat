const VERSIONS = [
  { href: "/high-chair", label: "High Chair", emoji: "🪑" },
  { href: "/fridge", label: "Fridge Door", emoji: "🖍️" },
  { href: "/casino", label: "Mealtime Casino", emoji: "🎰" },
];

// Footer links between the three versions. Each page styles `.vnav` in its own idiom.
// Plain links, not next/link: in production each version is its own subdomain and the
// Worker redirects these paths there, so a full page load is what we want.
export function VersionNav({ current }: { current: string }) {
  return (
    <nav className="vnav" aria-label="Other versions">
      <span>Try another version</span>
      {VERSIONS.filter((v) => v.href !== current).map((v) => (
        <a key={v.href} href={v.href}>
          {v.emoji} {v.label}
        </a>
      ))}
    </nav>
  );
}
