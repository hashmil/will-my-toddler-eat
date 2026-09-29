import type { Metadata } from "next";
import { Lilita_One } from "next/font/google";
import HighChair from "./high-chair";
import "./high-chair.css";

const lilita = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-lilita" });

export const metadata: Metadata = {
  title: "High Chair · Will My Toddler Eat This?",
  description: "Serve a food to a 3D toddler and see if it gets eaten or thrown at your screen.",
};

export default function Page() {
  return (
    <div className={lilita.variable}>
      <HighChair />
    </div>
  );
}
