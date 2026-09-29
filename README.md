# Will My Toddler Eat This? 🍽️

The ultimate parental food predictor - brace yourself for the toddler verdict!

## About

A joke predictor for exhausted parents. Type a food, set the toddler's mood, the plate colour and the meal, and find out whether it gets eaten. Three versions of the same idea:

- **High Chair** (`/high-chair`): a 3D toddler in a high chair. Serve the food and it gets eaten, poked, cried at, or thrown at your screen.
- **Fridge Door** (`/fridge`): a crayon drawing on the fridge that pulls faces as you type.
- **Mealtime Casino** (`/casino`): pull the lever on a slot machine. The house always wins. The house is 2.

All three share one prediction engine (`lib/predict.ts`). It knows common toddler favourites and suspected vegetables, picks a favourite plate and a cursed plate each day, and shows its working. Same food and conditions give the same answer until midnight.

## Tech Stack

- **Next.js 16** (App Router, static export)
- **TypeScript**
- **Tailwind CSS 4** for the home page; each version has its own scoped stylesheet
- **Three.js** for the High Chair scene
- Sound effects are synthesised with the Web Audio API, no audio files

## Getting Started

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

Design mockups and the direction for each version are in `mockups/` (`mockups/DESIGN.md`).

## License

This project is created for fun and learning purposes.

---

⚠️ **Disclaimer**: Results are 100% scientifically unproven but emotionally accurate.  
Made with ❤️ for exhausted parents everywhere.
