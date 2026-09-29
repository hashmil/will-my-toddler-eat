// Shared prediction engine for the v2 mockups.
// Deterministic per day: same food + conditions give the same answer until midnight,
// because toddlers are allowed to change their minds overnight.
(function () {
  const LOVED = [
    "chip", "fries", "chocolate", "nugget", "pasta", "pizza", "ice ?cream", "cheese", "banana",
    "cracker", "yogh?urt", "cake", "cookie", "biscuit", "toast", "pancake", "waffle", "sausage",
    "noodle", "rice", "grapes?", "strawberr", "apple", "popcorn", "hummus", "bread", "mac",
    "spaghetti", "crisps", "dumpling", "blueberr", "raisin", "fish fingers?",
  ];
  const FEARED = [
    "broccoli", "spinach", "fish(?! finger)", "kale", "mushroom", "sprout", "peas?\\b", "salad",
    "tomato", "onion", "cauliflower", "lentil", "quinoa", "asparagus", "aubergine", "eggplant",
    "courgette", "zucchini", "olive", "beetroot", "cabbage", "celery", "liver", "tofu", "avocado",
    "curry", "caviar", "soup", "carrot", "pepper", "stew",
  ];

  const EMOJI = [
    ["broccoli", "🥦", "#4E9A2E"], ["pizza", "🍕", "#E8A33D"], ["pasta|spaghetti|noodle|mac", "🍝", "#E9B949"],
    ["fish", "🐟", "#9FB7C9"], ["banana", "🍌", "#F4D03F"], ["apple", "🍎", "#D93A2B"],
    ["chip|fries", "🍟", "#F2B233"], ["chocolate", "🍫", "#6B3E26"], ["cake", "🍰", "#F6C6D0"],
    ["cookie|biscuit", "🍪", "#C8894A"], ["ice ?cream", "🍦", "#F9E3C2"], ["cheese", "🧀", "#F7C948"],
    ["egg", "🍳", "#F9D342"], ["carrot", "🥕", "#EE7B25"], ["tomato", "🍅", "#E03A2F"],
    ["mushroom", "🍄", "#C9A27E"], ["grape", "🍇", "#7B3FA0"], ["strawberr", "🍓", "#E0324B"],
    ["pea", "🫛", "#6DBE45"], ["avocado", "🥑", "#7BA23F"], ["corn", "🌽", "#F4C430"],
    ["bread|toast", "🍞", "#D9A05B"], ["pancake|waffle", "🥞", "#E1A95F"], ["rice", "🍚", "#F2F2EA"],
    ["nugget|chicken", "🍗", "#D98E3B"], ["sausage", "🌭", "#C0563B"], ["soup|stew|curry", "🍲", "#C4692F"],
    ["salad|kale|spinach|lettuce", "🥬", "#5DA130"], ["dumpling", "🥟", "#EFD9B4"], ["yog", "🥛", "#F4F1EA"],
    ["pepper", "🫑", "#3E9B3A"], ["onion", "🧅", "#D8B48A"], ["potato", "🥔", "#C8A165"],
  ];

  const PLATES = [
    { id: "red", color: "#EF4444", name: "Cherry Red" },
    { id: "blue", color: "#3B82F6", name: "Ocean Blue" },
    { id: "green", color: "#22C55E", name: "Grass Green" },
    { id: "yellow", color: "#EAB308", name: "Sunny Yellow" },
    { id: "purple", color: "#A855F7", name: "Magic Purple" },
    { id: "pink", color: "#EC4899", name: "Princess Pink" },
  ];
  const MOODS = [
    { id: "adventurous", label: "Adventurous", emoji: "🤠" },
    { id: "picky", label: "Picky", emoji: "🧐" },
    { id: "hangry", label: "Hangry", emoji: "😤" },
    { id: "sleepy", label: "Sleepy", emoji: "😴" },
  ];
  const MEALS = [
    { id: "breakfast", label: "Breakfast", emoji: "🌅" },
    { id: "lunch", label: "Lunch", emoji: "☀️" },
    { id: "dinner", label: "Dinner", emoji: "🌙" },
    { id: "snack", label: "Snack", emoji: "🍪" },
  ];

  const LINES = {
    gobble: [
      "{Food} will vanish so fast you'll wonder if it was ever there.",
      "They'll eat the {food}, then start on yours.",
      "Clean plate. Then a formal request for {food} at breakfast.",
    ],
    dance: [
      "{Food} triggers the chair dance. Film it. It will not happen again.",
      "Full-body joy. Some {food} may reach the mouth.",
    ],
    suspicious: [
      "{Food} will be inspected, licked once, and returned to sender.",
      "One bite. Then the look. You know the look.",
      "They'll eat the {food} only if you don't watch. So don't watch.",
    ],
    negotiate: [
      "They'll eat the {food} for a price. The price is a biscuit.",
      "Opening offer: two bites of {food}. Final offer: none, plus a sticker.",
    ],
    throw: [
      "The {food} is going on the floor. The dog has been notified.",
      "{Food} will achieve brief flight, then the wall.",
      "Incoming {food}. Duck.",
    ],
    cry: [
      "The {food} touched the other food. This is now a tragedy.",
      "Real tears. Over {food}. In front of guests.",
    ],
    gag: [
      "Dramatic gagging at the smell of {food}. Award nomination pending.",
    ],
    sleep: [
      "Face down in the {food} by 18:07. Technically, contact was made.",
    ],
  };

  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  const matches = (list, food) => list.some((w) => new RegExp("\\b" + w, "i").test(food));

  function foodLook(food) {
    for (const [re, emoji, color] of EMOJI) if (new RegExp(re, "i").test(food)) return { emoji, color };
    return { emoji: "🍲", color: "#B8733A" };
  }

  function dayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function todaysPlates(date) {
    const d = dayKey(date);
    const fav = PLATES[hash(d + "fav") % PLATES.length];
    let cursed = PLATES[hash(d + "cursed") % PLATES.length];
    if (cursed.id === fav.id) cursed = PLATES[(PLATES.indexOf(fav) + 3) % PLATES.length];
    return { fav, cursed };
  }

  function predict({ food, mood, plate, meal, date }) {
    const clean = food.trim().toLowerCase();
    const h = hash([clean, mood, plate, meal, dayKey(date)].join("|"));
    const loved = matches(LOVED, clean);
    const feared = matches(FEARED, clean);
    const { fav, cursed } = todaysPlates(date);
    const factors = [];

    let score = 50;
    if (loved) factors.push(["Known toddler favourite", +30]);
    else if (feared) factors.push(["Contains suspected vegetable", -30]);
    else factors.push(["Never seen before, therefore poison", -10]);

    const moodDelta = {
      adventurous: ["Adventurous mood", +15],
      picky: ["Picky mood", -15],
      hangry: loved ? ["Hangry, but it's a favourite", +10] : ["Hangry", -20],
      sleepy: ["Too sleepy to object", -5],
    }[mood];
    factors.push(moodDelta);

    if (plate === fav.id) factors.push([`${fav.name} plate (today's favourite)`, +15]);
    else if (plate === cursed.id) factors.push([`${cursed.name} plate (cursed today)`, -25]);

    const mealDelta = { breakfast: ["Breakfast", 0], lunch: ["Lunch", +5], dinner: ["Dinner, the witching hour", -10], snack: ["Snack, so anything goes", +10] }[meal];
    if (mealDelta[1]) factors.push(mealDelta);

    const jitter = (h % 21) - 10;
    factors.push(["Mercury, basically", jitter]);

    for (const [, d] of factors) score += d;
    const pct = Math.max(1, Math.min(99, score));

    const verdict = pct >= 65 ? "yes" : pct >= 35 ? "maybe" : "no";
    let reaction;
    if (mood === "sleepy" && h % 4 === 0) reaction = "sleep";
    else if (verdict === "yes") reaction = h % 3 === 0 ? "dance" : "gobble";
    else if (verdict === "maybe") reaction = h % 2 ? "negotiate" : "suspicious";
    else reaction = ["throw", "throw", "cry", "gag"][h % 4];

    const lines = LINES[reaction];
    const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
    const line = lines[(h >>> 3) % lines.length].replace("{Food}", cap).replace("{food}", clean);
    const FOOD = clean.toUpperCase();
    const says = {
      gobble: `MORE ${FOOD}!`, dance: `${FOOD}! ${FOOD}!`, suspicious: "wha dat?",
      negotiate: "one bite... for BISCUIT", throw: `BYE BYE ${FOOD}`, cry: "NOOOOOO",
      gag: "*hurk*", sleep: "zzz",
    }[reaction];

    return { pct, verdict, reaction, line, says, factors, fav, cursed, look: foodLook(clean), loved, feared };
  }

  window.Toddler = { predict, PLATES, MOODS, MEALS, foodLook, todaysPlates, isLoved: (f) => matches(LOVED, f), isFeared: (f) => matches(FEARED, f) };
})();
