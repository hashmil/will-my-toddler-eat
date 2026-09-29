# Overview

Will My Toddler Eat This? is a joke predictor for tired parents, used one-handed on a phone at the table. The joke is fake science delivered deadpan, so each direction borrows a real format whose authority makes the verdict funnier. The verdict is the hero and must fit on one phone screen with the inputs, so a screenshot of it is shareable on its own.

Two candidate directions, one to be picked.

- **A. Lab report.** Artefact: a pathology test result slip. Idiom: technical document. Source: hospital lab printouts, where abnormal values carry an H/L flag against a reference range.
- **B. Dinner forecast.** Artefact: a TV/phone weather forecast. Idiom: broadcast weather graphic, big numeral, hourly strip, severe-weather warning band. Source: national weather service warnings (yellow/amber/red).

# Colors

A. Lab report
- `paper` #FFFFFF: the printed sheet
- `desk` #E4E7EB: the surface the sheet sits on
- `ink` #111418: all body text
- `form` #1D4F91: preprinted field labels and letterhead, the blue of NHS/hospital forms
- `rule` #C9D1DA: table rules
- `flag-low` #C8102E: L flag on an abnormal result
- `flag-query` #A15C00: ? flag on an equivocal result

B. Dinner forecast
- `sky` #0B3D91: broadcast weather blue, full-bleed background
- `sky-deep` #082C6B: panels
- `cloud` #FFFFFF: primary text
- `haze` #A9C1E8: secondary text
- `warn-yellow` #FFD200 and `warn-red` #E4002B: weather warning levels, from national warning schemes

# Typography

A. IBM Plex Sans (text) and IBM Plex Mono (values, IDs). Instrument printouts are monospaced; the letterhead is not. Steps: 11, 13, 15, 19, 24, 56.
B. Barlow Condensed (numerals, headings) and Barlow (text). Broadcast weather graphics use condensed grotesks for big numbers in narrow plates. Steps: 13, 15, 18, 24, 32, 96.

# Layout

Single column, 390px phone first, max 480px on desktop. Inputs above, verdict below, both visible without scrolling on a typical phone after submit.
A: 20px sheet margin, table rows at 36px, sections separated by a 2px `form` rule.
B: 16px margin, 12px between panels, 24px above the hero numeral.

# Elevation

A: none. The sheet is paper on a desk, a 1px `rule` border only.
B: none. Panels are a flat darker blue.

# Shapes

A: 0 radius everywhere. Printed forms have square corners.
B: 4px on panels and chips. Broadcast plates are near-square, softened only slightly.

# Components

Food input, mood picker (4), plate colour picker (6), meal picker (4), submit, verdict block.
A adds: specimen ID, reference range row, consultant comment, signature line.
B adds: warning band, hourly timeline (4 steps).
