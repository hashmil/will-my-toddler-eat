import Image from "next/image";
import Link from "next/link";
import { Lilita_One } from "next/font/google";
import highChair from "@/public/previews/high-chair.webp";
import fridge from "@/public/previews/fridge.webp";
import casino from "@/public/previews/casino.webp";

const lilita = Lilita_One({ weight: "400", subsets: ["latin"] });

const VERSIONS = [
  {
    href: "/high-chair",
    name: "High Chair",
    line: "Serve it to a 3D toddler. Watch it get eaten, or thrown at your screen.",
    img: highChair,
    style: "bg-[#BFE6F5] text-[#1B1B2F]",
    cta: "bg-[#E63B2E] text-white",
  },
  {
    href: "/fridge",
    name: "Fridge Door",
    line: "A crayon drawing of your toddler pulls faces as you type.",
    img: fridge,
    style: "bg-[#F4F6F8] text-[#222222]",
    cta: "bg-[#2F6FDE] text-white",
  },
  {
    href: "/casino",
    name: "Mealtime Casino",
    line: "Place your bet, pull the lever. The house always wins. The house is 2.",
    img: casino,
    style: "bg-[#140A24] text-white",
    cta: "bg-[#F7C948] text-[#140A24]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFC72C] px-4 pb-12 pt-10 text-[#1B1B2F]">
      <div className="mx-auto max-w-[480px]">
        <h1 className={`${lilita.className} text-5xl leading-[0.95]`}>
          Will my toddler
          <br />
          eat this?
        </h1>
        <p className="mt-3 text-lg">Three ways to find out. All scientifically unproven, all emotionally accurate.</p>

        <div className="mt-8 flex flex-col gap-5">
          {VERSIONS.map((v, i) => (
            <Link
              key={v.href}
              href={v.href}
              className={`${v.style} group flex items-stretch overflow-hidden rounded-[20px] shadow-[0_6px_0_rgba(27,27,47,.25)] transition-transform active:translate-y-1 ${i % 2 ? "flex-row-reverse" : ""}`}
            >
              <Image src={v.img} alt={`${v.name} screenshot`} unoptimized className="w-[42%] object-cover object-top" placeholder="blur" />
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h2 className={`${lilita.className} text-3xl leading-none`}>{v.name}</h2>
                  <p className="mt-2 text-[15px] leading-snug opacity-85">{v.line}</p>
                </div>
                <span className={`${v.cta} ${lilita.className} mt-4 self-start rounded-full px-4 py-2 text-lg transition-transform group-hover:scale-105`}>
                  Play
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm opacity-70">Made for exhausted parents everywhere.</p>
      </div>
    </main>
  );
}
