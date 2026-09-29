import type { Metadata } from "next";
import { Bungee, Bungee_Shade, Figtree } from "next/font/google";
import Casino from "./casino";
import "./casino.css";

const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const bungeeShade = Bungee_Shade({ weight: "400", subsets: ["latin"], variable: "--font-bungee-shade" });
const figtree = Figtree({ weight: ["400", "600", "800"], subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Mealtime Casino · Will My Toddler Eat This?",
  description: "Place your bet, pull the lever. The house always wins. The house is 2.",
};

export default function Page() {
  return (
    <div className={`${bungee.variable} ${bungeeShade.variable} ${figtree.variable}`}>
      <Casino />
    </div>
  );
}
