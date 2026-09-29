# Overview

Will My Toddler Eat This? is a joke predictor for tired parents, used on a phone at the table, often one-handed. Round 2 swaps deadpan print formats for physical comedy and a character you can watch react. Each concept is a different object with its own interaction; all three share `predict.js`, which knows loved and feared foods, has a daily favourite plate and a daily cursed plate, and shows its working as a list of factors.

1. **High Chair (3D).** Artefact: a vinyl toy toddler in a high chair, in a real-time 3D scene. You serve the food; it eats it, pokes it, cries, or flings it at the screen, where it splats on the glass. Idiom: toy stage. Source: moulded plastic baby toys, primary colours.
2. **Fridge Door (illustrated).** Artefact: a family fridge door. A crayon drawing of the toddler's face is held up by magnets and reacts live, letter by letter, as you type. Controls are fridge magnets. Idiom: kid's drawing on a fridge. Source: wax crayon on printer paper, alphabet magnets.
3. **Mealtime Casino (arcade).** Artefact: a slot machine. Plate colours are poker chips, mood is the table stakes, you pull the lever and the reels decide. Idiom: Vegas slot cabinet. Source: casino marquee signage, chaser bulbs.

# Colors

1. High Chair
- `wall` #BFE6F5 kitchen tile blue, `floor` #F5D7A1 lino
- `toy-red` #E63B2E, `toy-yellow` #FFC72C, `toy-blue` #1E6FD9, `toy-green` #2BA84A: primary moulded plastic
- `skin` #F6C9A5, `ink` #1B1B2F, `card` #FFFFFF
2. Fridge Door
- `enamel` #F4F6F8 fridge door, `enamel-shade` #DDE2E7 for the handle and door edge
- `paper` #FFFFFF drawing paper
- crayons: `crayon-red` #E5383B, `crayon-blue` #2F6FDE, `crayon-green` #38A33C, `crayon-orange` #F6893B, `crayon-brown` #8A5A3B, `crayon-black` #222222
3. Mealtime Casino
- `felt` #0E5A3A card-table green, `night` #140A24 casino floor
- `gold` #F7C948, `neon-pink` #FF3EA5, `bulb` #FFF3B0
- `reel` #FFFFFF, `ink` #140A24

# Typography

1. Lilita One (display, chunky like moulded toy letters) and DM Sans (text, already in the app).
2. Baloo 2 ExtraBold (alphabet magnets) and Gochi Hand (a child's handwriting, for everything written in crayon).
3. Bungee (display, designed for vertical signage and marquees) and Figtree (text).

Each: six steps from 13 to 72 on roughly a 1.3 ratio.

# Layout

All phone first, 390px wide, max 480px on desktop.
1. The 3D stage fills the top 45% of the screen, controls in a bottom sheet, the result card slides up over the controls.
2. The drawing sits top centre, magnets below, the result is a second drawing that gets stuck up next to it.
3. One cabinet, centred: marquee, reels window, payout panel, chip rack, lever on the right edge.

# Elevation

1. Real 3D lighting and soft shadows in the scene. The UI sheet uses one soft shadow and no border.
2. Magnets and paper cast a small hard drop shadow, because they sit on a door.
3. Glow instead of shadow: bulbs and neon. One gradient: a dark fade at the top and bottom of each reel, to sell the curve of the drum.

# Shapes

1. 20px radius on the sheet and buttons, matching the rounded toy.
2. Paper is square with a slight rotation. Magnets are circles or letter shapes.
3. Cabinet corners 24px, reels square, chips circles.

# Components

Shared: food input, mood picker (4), plate picker (6), meal picker (4), verdict with percentage, the toddler's line, the factor breakdown, try again.
1. 3D toddler with idle, gobble, poke, cry and throw animations; screen splat.
2. SVG face with live expression, speech bubble, magnet controls, pinned result drawing.
3. Reels, lever, chaser lights, payout message, chip rack.
