"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PredictionResult {
  message: string;
  percentage: number;
  type: 'positive' | 'negative' | 'maybe';
}

const moods = [
  { id: "adventurous", label: "Adventurous", emoji: "🌟", description: "Feeling brave today!" },
  { id: "picky", label: "Picky", emoji: "😤", description: "Everything is suspicious" },
  { id: "hangry", label: "Hangry", emoji: "😠", description: "Danger zone activated" },
  { id: "sleepy", label: "Sleepy", emoji: "😴", description: "Too tired to care" },
]

const plateColors = [
  { id: "red", color: "#ef4444", name: "Cherry Red" },
  { id: "blue", color: "#3b82f6", name: "Ocean Blue" },
  { id: "green", color: "#22c55e", name: "Grass Green" },
  { id: "yellow", color: "#eab308", name: "Sunny Yellow" },
  { id: "purple", color: "#a855f7", name: "Magic Purple" },
  { id: "pink", color: "#ec4899", name: "Princess Pink" },
]

const timeOfDay = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅" },
  { id: "lunch", label: "Lunch", emoji: "☀️" },
  { id: "dinner", label: "Dinner", emoji: "🌙" },
  { id: "snack", label: "Snack", emoji: "🍪" },
]

const responses = {
  positive: [
    "YES! 🎉 Your toddler will devour this like it's the last food on Earth!",
    "😋 They'll ask for seconds, thirds, and maybe fourths!",
    "100% YES! 🌟 This will be their new favorite food for exactly 3 days!",
    "Oh yes! 🤤 They'll eat it so fast you'll wonder if they even chewed!",
    "Definitely! 🎊 They might even compliment the chef (that's you)!",
    "JACKPOT! 🎰 They'll clean their plate AND ask what's for dessert!",
    "🚀 They'll eat it while doing a happy dance in their chair!",
    "Winner winner! 🏆 This will disappear faster than your sanity at bedtime!",
    "OH YES! 🎪 They'll eat it and then lick the plate clean (literally)!",
    "Success! 🌈 They'll eat it and declare you the 'best parent ever' for 5 minutes!",
    "BINGO! 🎯 They'll finish it and ask if they can have it for breakfast tomorrow!",
    "Victory! ⚡ They'll eat every bite and maybe even try to eat the fork too!",
    "Touchdown! 🏈 They'll gobble it up and ask for the recipe (as if they can cook)!",
    "Perfection! ✨ They'll eat it so enthusiastically you'll question if you switched kids!",
    "AMAZING! 🎭 They'll finish it and then ask what other 'yummy surprises' you have!",
    "Fantastic! 🎨 They'll eat it and then try to convince their stuffed animals to try some!",
    "Incredible! 🎪 They'll clean their plate and then ask if vegetables always taste this good!",
    "Spectacular! 🎊 They'll eat it and then offer to help you cook it again tomorrow!",
    "Outstanding! 🌟 They'll finish every crumb and then ask if they can share it with the dog!",
    "Phenomenal! 🎉 They'll eat it so happily you'll take 47 photos to document this miracle!",
    "Marvelous! 🎈 They'll devour it and then ask if this is what 'grown-up food' tastes like!",
  ],
  negative: [
    "NOPE! 🙅‍♀️ This will end up decorating the floor, walls, and possibly the ceiling!",
    "Not a chance! 😂 They'll take one look and declare it 'yucky' without even trying it!",
    "Absolutely not! 🚫 This will sit on their plate until it becomes a science experiment!",
    "No way! 🤢 They'll act like you're trying to poison them with this 'weird' food!",
    "Never! 😤 They'll dramatically gag just from the smell!",
    "DISASTER! 💥 They'll push the plate away and demand mac and cheese instead!",
    "Catastrophe! 🌪️ They'll take one tiny bite and then spit it out dramatically!",
    "Epic fail! 🎭 They'll look at you like you've personally betrayed their trust!",
    "Not happening! 🚨 They'll hide under the table until you bring out the goldfish crackers!",
    "Forget it! 🙈 They'll cry actual tears and ask why you don't love them anymore!",
    "No chance! 🎪 They'll throw it on the floor and then step on it for good measure!",
    "Impossible! 🌋 They'll have a full meltdown and demand to call grandma for 'real food'!",
    "Dream on! 🎨 They'll use it as finger paint before they'd ever consider eating it!",
    "Not today! ⛈️ They'll dramatically declare they're 'starving' but still won't touch it!",
    "Nuh-uh! 🎯 They'll negotiate for 47 different alternatives before giving up entirely!",
    "Zero chance! 🎰 They'll ask if the dog can have it instead (the dog probably won't want it either)!",
    "Absolutely not! 🎪 They'll pretend to be asleep rather than acknowledge this food exists!",
    "No way José! 🌪️ They'll build a fortress out of napkins to protect themselves from it!",
    "Not in a million years! 🎭 They'll ask if this is punishment for something they did!",
    "Forget about it! 🚨 They'll offer to trade it for literally anything else in the house!",
    "Never ever! 🎨 They'll look at it like it personally insulted their favorite toy!",
  ],
  maybe: [
    "Maybe... 🤔 It depends on if Mercury is in retrograde and if they're wearing their lucky socks!",
    "50/50 chance! 🎲 They might eat it if you call it 'special grown-up food'!",
    "Possibly! 🤷‍♀️ Success rate increases by 73% if served on their favorite plate!",
    "It's complicated... 🤯 They loved it yesterday but today it's 'disgusting'!",
    "Who knows?! 🎭 Toddler food preferences change faster than the weather!",
    "Uncertain! 🎪 They might eat it if you pretend it's what their favorite cartoon character eats!",
    "Flip a coin! 🪙 Success depends entirely on whether they woke up on the right side of the crib!",
    "Maybe so! 🎨 They'll eat it if you let them use the 'special' fork (any fork but the one you gave them)!",
    "It's possible! 🎯 Depends on whether they remember they 'hate' this food or not!",
    "Could happen! 🎰 They might eat it if you sing the ABC song while they chew!",
    "Perhaps! 🌈 Success rate doubles if you eat some first and make exaggerated 'yum' sounds!",
    "Might work! 🎊 They'll consider it if you arrange it into the shape of their favorite animal!",
    "Questionable! 🎭 They may eat it if their imaginary friend approves first!",
    "Unclear! 🎪 Depends on whether they're in a 'trying new things' mood (rare but possible)!",
    "Potentially! 🎨 They might eat it if you tell them it will make them grow as tall as daddy!",
    "Unknown! 🎯 Success hinges on whether they've decided to be cooperative today!",
    "Possibly maybe! 🎲 They'll eat it if you let them feed some to their stuffed animal first!",
    "It's a gamble! 🎰 They might try it if you promise they don't have to finish it!",
    "Could go either way! 🌪️ Depends on whether they're feeling adventurous or extra stubborn!",
    "Jury's out! ⚖️ They'll eat it if the stars align and they haven't had a snack in the last 10 minutes!",
    "Wildcard! 🃏 They might surprise you and love it, or they might use it as a hat!",
  ],
}

function getRandomResponse(food: string, mood: string, plateColor: string, time: string) {
  const factors = [food.toLowerCase(), mood, plateColor, time]
  const hash = factors
    .join("")
    .split("")
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

  const responseType = Math.abs(hash) % 3
  const responseCategory = responseType === 0 ? "positive" : responseType === 1 ? "negative" : "maybe"
  const responseArray = responses[responseCategory]
  const responseIndex = Math.abs(hash) % responseArray.length

  const percentage =
    responseType === 0
      ? Math.floor(Math.random() * 20) + 80
      : responseType === 1
        ? Math.floor(Math.random() * 30) + 5
        : Math.floor(Math.random() * 40) + 30

  return {
    message: responseArray[responseIndex],
    percentage,
    type: responseCategory as 'positive' | 'negative' | 'maybe',
  }
}

export default function ToddlerFoodPredictor() {
  const [food, setFood] = useState("")
  const [selectedMood, setSelectedMood] = useState("picky")
  const [selectedPlate, setSelectedPlate] = useState("red")
  const [selectedTime, setSelectedTime] = useState("lunch")
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePredict = async () => {
    if (!food.trim()) return

    setIsLoading(true)
    // Add a fun loading delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const prediction = getRandomResponse(food, selectedMood, selectedPlate, selectedTime)
    setResult(prediction)
    setIsLoading(false)
  }

  const selectedMoodData = moods.find((m) => m.id === selectedMood)
  const selectedPlateData = plateColors.find((p) => p.id === selectedPlate)
  const selectedTimeData = timeOfDay.find((t) => t.id === selectedTime)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">Will My Toddler Eat This? 🍽️</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The ultimate parental food predictor. Brace yourself for the toddler verdict!
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-800">
              What food are you brave enough to try? 🤔
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Food Input */}
            <div className="space-y-2">
              <Input
                placeholder="Type a food... (e.g., Broccoli, Fish Fingers, Caviar)"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                className="text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && handlePredict()}
              />
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>😊</span> Current Toddler Mood
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMood === mood.id ? "default" : "outline"}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`p-3 h-auto flex flex-col items-center gap-1 rounded-xl transition-all ${
                      selectedMood === mood.id
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                        : "hover:bg-orange-50 border-orange-200"
                    }`}
                  >
                    <span className="text-xl">{mood.emoji}</span>
                    <span className="text-xs font-medium">{mood.label}</span>
                  </Button>
                ))}
              </div>
              {selectedMoodData && (
                <p className="text-sm text-gray-600 text-center italic">{selectedMoodData.description}</p>
              )}
            </div>

            {/* Plate Color Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>🍽️</span> Plate Color (Very Important!)
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {plateColors.map((plate) => (
                  <button
                    key={plate.id}
                    onClick={() => setSelectedPlate(plate.id)}
                    className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                      selectedPlate === plate.id
                        ? "border-gray-800 shadow-lg scale-110"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ backgroundColor: plate.color }}
                    title={plate.name}
                  />
                ))}
              </div>
              {selectedPlateData && (
                <p className="text-sm text-gray-600 text-center">Selected: {selectedPlateData.name}</p>
              )}
            </div>

            {/* Time of Day */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>⏰</span> Time of Day
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {timeOfDay.map((time) => (
                  <Button
                    key={time.id}
                    variant={selectedTime === time.id ? "default" : "outline"}
                    onClick={() => setSelectedTime(time.id)}
                    className={`p-3 h-auto flex flex-col items-center gap-1 rounded-xl transition-all ${
                      selectedTime === time.id
                        ? "bg-purple-500 hover:bg-purple-600 text-white shadow-md"
                        : "hover:bg-purple-50 border-purple-200"
                    }`}
                  >
                    <span className="text-xl">{time.emoji}</span>
                    <span className="text-xs font-medium">{time.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <Button
              onClick={handlePredict}
              disabled={!food.trim() || isLoading}
              className="w-full p-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🤔</span>
                  Consulting the toddler oracle...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🔮</span>
                  Predict the Outcome!
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card
            className={`shadow-lg border-0 transition-all duration-500 ${
              result.type === "positive"
                ? "bg-green-50 border-green-200"
                : result.type === "negative"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="space-y-2">
                <Badge
                  className={`text-lg px-4 py-2 ${
                    result.type === "positive"
                      ? "bg-green-500"
                      : result.type === "negative"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  } text-white`}
                >
                  Success Rate: {result.percentage}%
                </Badge>
                <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed">{result.message}</p>
              </div>

              <Separator className="my-4" />

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Food:</strong> {food}
                </p>
                <p>
                  <strong>Mood:</strong> {selectedMoodData?.label} {selectedMoodData?.emoji}
                </p>
                <p>
                  <strong>Plate:</strong> {selectedPlateData?.name}
                </p>
                <p>
                  <strong>Time:</strong> {selectedTimeData?.label} {selectedTimeData?.emoji}
                </p>
              </div>

              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="mt-4 border-gray-300 hover:bg-gray-50"
              >
                Try Another Food 🍴
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>⚠️ Results are 100% scientifically unproven but emotionally accurate</p>
          <p className="mt-1">Made with ❤️ for exhausted parents everywhere</p>
        </div>
      </div>
    </div>
  )
}
