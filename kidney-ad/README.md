# Kidney ad — production brief

Vertical (9:16) dialogue ad: **Bad Kidney** vs **Good Kidney**, English, ~2:50 total.

## Rules (apply to every clip)

- User generates all images; Claude only animates them in Kling and writes the Kling prompts.
- No subtitles, no on-screen text, no background music, no sound effects.
- Clean lip-sync on the speaking character only. The other character (if in frame) keeps mouth closed and still.
- Two distinct, consistent English voices (one per character) across all clips.
- Minimal motion: static camera, small natural head/eye movement, no extra gestures.
- Vertical 9:16, cheapest model that still does native audio + lip-sync, 720p, one variant per clip.
- Never rewrite the user's lines. Use the exact text the user sends for each clip.
- Every prompt is one copy-paste block; hard rules (no on-screen text, no subtitles, no music, no SFX, only the speaker's voice, no extra characters) go at the very start.
- No test generations. Confirm parameters with the user before spending credits.

## Voices

- **Bad Kidney:** tired, slightly hoarse young adult male American English voice (clip 01 approved).
- **Good Kidney:** warm, pleasant, friendly young adult female American English voice, clear and calm.

## Kling setup

- Model: `kling-video-v3_0` (image-to-video, native audio, Elements). The cheaper `v3_0_turbo` has no audio.
- `resolution=720p`, `imageCount=1`, `enable_audio=true`, `prefer_multi_shots=false`, `duration` = per clip below (3–15 s).
- Two Elements (`Bad Kidney`, `Good Kidney`), each with the character image and a fixed voice `.mp3`, so voices stay the same in every clip.

## Script and clips

Durations are estimates (~2.6 words/s plus a short pause). Lines longer than 15 s are split into two clips.

| Clip | Speaker | Line | Dur |
|---|---|---|---|
| 01 | Bad | Bro, he's Googling 'foamy urine' at three in the morning. Then he sees it in the toilet again when he wakes up. | 9 |
| 02 | Good | And he closes the page as soon as he sees the word 'kidneys'? | 6 |
| 03 | Bad | Yeah. Then he buys another 'kidney support' supplement. Half his cabinet is already full of bottles, and he still has no answers. What's he missing? | 10 |
| 04 | Good | He's reading what's on the bottles. He needs to understand what's happening inside the cells. Ever heard of oxidative stress? | 9 |
| 05 | Bad | No. His bottles just say 'kidney support.' Explain what that means. | 5 |
| 06a | Good | Think of a filter that works every day. It's not just what passes through it that matters, but the condition of the filter itself. | 9 |
| 06b | Good | During oxidative stress, reactive molecules can damage cells, including kidney cells. The hydroxyl radical is one of those molecules. But foam in the toilet alone can't tell you that's the cause. | 13 |
| 07 | Bad | Wait. He sees foam in the morning, can barely get his socks off his swollen feet at night, and blames the fatigue on getting older. Could those things be connected? | 12 |
| 08a | Good | They could. Protein in the urine can cause foam. Fluid retention causes swelling. Impaired kidney function can also cause fatigue. | 9 |
| 08b | Good | But he keeps explaining each thing away: 'Not enough water. Tight socks. Just getting older.' Instead of getting the cause checked. | 9 |
| 09 | Bad | What if he just drinks more water? | 4 |
| 10 | Good | Water just flows through the damage, man. It doesn't repair anything. | 5 |
| 11 | Bad | Okay, what about supplements? He takes CoQ10 and fish oil every morning. | 6 |
| 12 | Good | Even worse. Every pill he swallows gets broken down, and the waste comes straight to you to filter out. You're already drowning in damage, and now you have to clean up his supplement mess too. | 14 |
| 13 | Bad | So everything he takes to help me is actually making me work harder? | 6 |
| 14 | Good | Exactly. The real problem keeps burning you up from the inside while he just piles more work on top. | 8 |
| 15 | Bad | Man, so what actually works? | 3 |
| 16a | Good | Hydrogen tablets. Molecular hydrogen is the smallest molecule in existence, so it can get inside your kidney cells. | 8 |
| 16b | Good | It finds only the hydroxyl radicals, takes them out, and turns into water. Zero waste. Nothing for you to clean up. | 8 |
| 17 | Bad | So the foam, the swelling, all of that goes away? | 5 |
| 18 | Good | Give it thirty days, bro. Most people see the swelling go down. Their back stops aching. Their energy lasts all day. No more staring into the toilet freaking out. | 12 |
| 19 | Bad | Man, I can finally breathe again. | 3 |
| 20 | Good | Thirty-day money-back guarantee. Link below. | 3 |

23 clips, ~178 s of generated video before trimming.

## Prompt template

```
Locked-off static camera, no zoom, no pan, framing exactly as in the image. The cartoon kidney
character is the only character in the scene; no people, no other characters, nothing new
enters the frame. It starts speaking immediately at the first second, in a <VOICE> American
English voice, saying exactly: "<LINE>"
Precise lip-sync to every word. Minimal natural head and eye movement, no extra gestures.
No music, no sound effects, no other voices, no subtitles, no on-screen text.
```

Never mention a listener, "someone", or "off-screen" — Kling draws them into the frame
(clip 01, first take: a human appeared on the right edge).

## Current script, lines 1–10 (replaces the table above for clips 1–10)

| # | Speaker | Line | Dur |
|---|---|---|---|
| 1 | Bad | Bro, there is foam in my guy's toilet every single morning and he has no idea why. | 7 |
| 2 | Good | That is not a hydration problem, man. That is you leaking. | 5 |
| 3 | Bad | So what is actually happening to me? | 4 |
| 4 | Good | You are getting destroyed from the inside, man, by a molecule called the hydroxyl radical. | 7 |
| 5 | Bad | The what? | 3 |
| 6 | Good | Hydroxyl radical. It is basically acid inside your kidney cells. It is burning through your nephrons every single day. Those nephrons are the tiny filters that clean the blood. | 13 |
| 7 | Bad | So that is why there is foam, swelling, exhaustion, all from those filters getting burned. | 7 |
| 8a | Good | All of it. When your filters leak, protein shows up in his urine. That is the foam. | 7 |
| 8b | Good | When you cannot pull fluid out of his body, that is the swelling. And when you cannot clean his blood properly, he feels tired all the time. | 10 |
| 9 | Bad | So if he just drinks more water? | 4 |
| 10 | Good | Water flows right through the damage, man. It does not repair anything. | 5 |
