# Final script (20 lines) and Veo 3.1 Lite clip plan

Veo 3.1 Lite via OpenRouter, 720p, 9:16, audio on, $0.05/s. Clip lengths are 4, 6 or 8 s only;
lines that don't fit 8 s are split into consecutive clips on the same image. Text is the user's, verbatim.

| Clip | Line | Speaker | Text | s |
|---|---|---|---|---|
| 01 | 1 | Bad | Bro, there is foam in my guy's toilet every single morning and he has no idea why. | 8 |
| 02 | 2 | Good | That is not a hydration problem, man. That is you leaking. | 6 |
| 03 | 3 | Bad | So what is actually happening to me? | 4 |
| 04 | 4 | Good | You are getting destroyed from the inside, man, by a molecule called the hydroxyl radical. | 8 |
| 05 | 5 | Bad | The what? | 4 |
| 06a | 6 | Good | Hydroxyl radical. It is basically acid inside your kidney cells. | 6 |
| 06b | 6 | Good | It is burning through your nephrons every single day. Those nephrons are the tiny filters that clean the blood. | 8 |
| 07 | 7 | Bad | So that is why there is foam, swelling, exhaustion, all from those filters getting burned. | 8 |
| 08a | 8 | Good | All of it. When your filters leak, protein shows up in his urine. That is the foam. | 8 |
| 08b | 8 | Good | When you cannot pull fluid out of his body, that is the swelling. | 6 |
| 08c | 8 | Good | And when you cannot clean his blood properly, he feels tired all the time. | 6 |
| 09 | 9 | Bad | So if he just drinks more water? | 4 |
| 10 | 10 | Good | Water flows right through the damage, man. It does not repair anything. | 6 |
| 11 | 11 | Bad | Okay, then supplements? He has CoQ10 and fish oil at home. | 6 |
| 12a | 12 | Good | Even worse. Every pill he swallows gets broken down and the waste comes straight to you to filter out. | 8 |
| 12b | 12 | Good | You are already drowning in damage and now you have to clean up his supplement mess too. | 8 |
| 13 | 13 | Bad | So everything he takes to help me is actually making me work harder? | 6 |
| 14 | 14 | Good | Exactly. The real problem keeps burning you up while he just piles more work on top. | 8 |
| 15 | 15 | Bad | Man. So what actually works? | 4 |
| 16a | 16 | Good | Hydrogen tablets. Molecular hydrogen is the smallest molecule that exists so it can get inside your kidney cells. | 8 |
| 16b | 16 | Good | It finds only the hydroxyl radicals, takes them out and turns into water. Zero waste. Nothing for you to clean up. | 8 |
| 17 | 17 | Bad | So the foam, the swelling, all of that goes away? | 6 |
| 18a | 18 | Good | Give it 30 days, bro. Most people see the swelling drop. | 6 |
| 18b | 18 | Good | Back stops aching. Energy holds all day. No more staring into the toilet freaking out. | 8 |
| 19 | 19 | Bad | Man, I could finally breathe again. | 4 |
| 20 | 20 | Good | 30-day money-back guarantee. Link is below. | 4 |

26 clips, 166 s, ≈ $8.30. Budget: $10 top-up (≈ $9.50 after fee), ≈ $1.20 left for retakes.

## Storyboard (images)

Images are named after the old clips they were used in:
К1 Bad open palm (01) · К2 Good plain (02) · К3 Bad with pill bottle (03) · К4 Good, glowing cell above head (04) ·
К5 Bad spotted, foam + ZZZ inserts (05) · К6 Good, filter left / sick cell right (06) · К7 Bad, glass of water + bottle (07) ·
К8 Good points at cell, particles, bottle at bottom (08) · К9 Bad healing (09) · К10 Good holding product bottle (10)

| Line | Image | Action |
|---|---|---|
| 1 | К1 | talks, tired |
| 2 | К2 | talks, calm, slight smirk |
| 3 | К1 | talks, scared, eyes wider |
| 4 | К4 | cell rotates; flashes alarm light on "hydroxyl radical" |
| 5 | К1 | "The what?", shocked, brows up |
| 6a / 6b | К6 | 6a points at sick cell (right); 6b on "nephrons… tiny filters" turns and points at filter (left) |
| 7 | К5 | pulses; foam insert on "foam", body swells on "swelling", ZZZ on "exhaustion" |
| 8a / 8b / 8c | К6 / К2 / К2 | 8a points at filter on "filters leak"; 8b, 8c just explains |
| 9 | К7 | holds glass, hopeful, no pills into water |
| 10 | К6 | points at filter, shakes head |
| 11 | К3 | lifts the bottle on "CoQ10 and fish oil" |
| 12a / 12b | К2 | explains, disapproving |
| 13 | К3 | pours pills on own head while talking |
| 14 | К6 | points at sick cell, cell smoulders/pulses |
| 15 | К1 | tired, hopeful |
| 16a / 16b | К8 | 16a particles circle and enter the cell; 16b cell clears and glows, soft glow on "zero waste" |
| 17 | К9 | heals: spots fade, brighter, smiles |
| 18a / 18b | К10 | 18a holds bottle; 18b slowly extends bottle to camera, yellow particles |
| 19 | last frame of clip 17 | healthy kidney exhales, smiles |
| 20 | К10 | bottle close to camera, final |

Optional new images: scared/shocked Bad (3, 5); water pouring through cracked filter (10); Good with pile of pills, waste flying to Bad (12).

## Generation setup

OpenRouter API key goes in the environment secrets as `OPENROUTER_API_KEY` (never in chat). Model `google/veo-3.1-lite`,
720p, 9:16, audio on, image as first frame. Show the user the cost per clip and wait for "go" before generating.
