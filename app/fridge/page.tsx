import type { Metadata } from "next";
import { Baloo_2, Gochi_Hand } from "next/font/google";
import Fridge from "./fridge";
import "./fridge.css";

const baloo = Baloo_2({ weight: "800", subsets: ["latin"], variable: "--font-baloo" });
const gochi = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-gochi" });

export const metadata: Metadata = {
  title: "Fridge Door · Will My Toddler Eat This?",
  description: "A crayon drawing of your toddler reacts as you type the food.",
};

export default function Page() {
  return (
    <div className={`${baloo.variable} ${gochi.variable}`}>
      <Fridge />
    </div>
  );
}
