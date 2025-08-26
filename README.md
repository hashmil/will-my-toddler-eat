# Will My Toddler Eat This? 🍽️

The ultimate parental food predictor - brace yourself for the toddler verdict!

## About

A fun and interactive web app that "predicts" whether your toddler will eat a particular food based on their current mood, plate color, and time of day. Built with humor and designed for exhausted parents who need a laugh while navigating the mysterious world of toddler food preferences.

## Features

- **Food Prediction Engine**: Enter any food and get a humorous prediction
- **Mood Selection**: Choose from 4 different toddler moods (Adventurous, Picky, Hangry, Sleepy)
- **Plate Color Impact**: Select from 6 colorful plates because we all know it matters
- **Time of Day**: Factor in whether it's breakfast, lunch, dinner, or snack time
- **Entertaining Responses**: Over 60 funny and relatable responses for parents
- **Beautiful UI**: Built with modern components and smooth animations

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern React UI components
- **Radix UI** - Accessible component primitives

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

## Components Used

- **Button** - Interactive buttons with variants
- **Input** - Food input field
- **Card** - Container components for sections
- **Badge** - Success rate display
- **Separator** - Visual dividers

## How It Works

The app uses a pseudo-random algorithm based on the combination of:
- Food name (converted to lowercase)
- Selected mood
- Chosen plate color
- Time of day

These factors are hashed together to consistently return the same result for the same inputs, making it feel like a "real" prediction while maintaining the fun factor.

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is created for fun and learning purposes.

---

⚠️ **Disclaimer**: Results are 100% scientifically unproven but emotionally accurate.  
Made with ❤️ for exhausted parents everywhere.
