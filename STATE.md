# STATE — what is true right now

One file. If a claim is not here, it is not known. Every row carries where it was verified, so
the next session re-checks a number instead of the whole story.

Last verified: **2026-11-16**, on this laptop (`aman-laptop`). Verify with the command in the
`check` column, never from memory or from another session's report.

---

## 1. Repos

| Repo | HEAD | Unpushed | Remote | check |
|---|---|---|---|---|
| `C:/Projects/namo-studio` | `789e622` | **9 commits** | `onenamocom-stack/namo-studio` | `git log --oneline origin/main..HEAD` |
| `C:/Projects/ananta-pitch-site` | `f9fe8c4` | 0 | `acovrp/ananta-pitch` | `git status -sb` |
| `C:/Projects/rubans-app-pitch` | `9015797` | 0 | — | `git status -sb` |
| `C:/Projects/namoApp` | `11122820` | 0 | team pushes daily | `git rev-list --count HEAD..origin/main` |
| `C:/Projects/namo-studio-engine` | `32422cd` | 0 | — | `git status -sb` |

`namoApp` is **267 commits behind** its origin. That is the team's work, not ours. Pull only
after deciding what to do with the 3 uncommitted doc edits (§5).

---

## 2. Delivered and live

| What | Where | Size / length | Verified |
|---|---|---|---|
| ep01 v2 film | `https://media.1namo.com/render/films/ep01/final.mp4` | 85,361,322 B, 88.25 s, 1080x1920 | HTTP 200, Content-Length matches |
| ep01 audio level | in that file | **-16.04 LUFS, TP -3.1 dBTP** | `ffmpeg -i ... -af loudness` |
| Ananta investor film | `acovrp.github.io/ananta-pitch/` | 41,291,332 B, **212.93 s (3:33)** | HTTP 200, MD5 `a13fa4d9…` |
| Ananta pitch page | `https://acovrp.github.io/ananta-pitch/` | `index.html` 34,432 B | byte-identical to local `f9fe8c4` |

The investor film exists twice with the **same MD5** `a13fa4d95f438a07e053e93e0be54613`:
`ananta-pitch-site/ananta-investor-3min.mp4` and `rubans-app-pitch/pitch/out/ananta-investor-3min.mp4`.
One source of truth for the bytes; the site copy is the one that ships.

---

## 3. The ep01 audio fix — what was actually wrong

Voice sat **level with the music**, so the words were inside the score.

| Setting | Before | After | Where |
|---|---|---|---|
| `voice_mean_db` | -20 dBFS | **-14** | `manufacture/SOUND_BIBLE.json: mix` |
| `music_bed_lufs` | -22 LUFS | **-26** | same |
| `duck_db` | 6 dB | **10** | same |

Measured, not assumed: at each voice line the film is now **18-26 dB above** `music.wav`
(B1 +25.6, B2 +17.7, C1 +20.0, E1 +22.6). Before the fix the same windows differed by 1-2 dB.

**A measurement trap, recorded so it is not repeated:** `highpass=300,lowpass=3000` does **not**
isolate speech here — the tanpura and cello occupy that band too, so the "speech band" reads the
same everywhere. Compare a window against `music.wav` instead.

Rebuild: `python manufacture/namo_studio.py ep01`, then publish with the `film-r2.yml` workflow
(`-f ep=ep01 -f release=<tag>`). The workflow prints the public URL it verified.

---

## 4. Decisions taken — do not re-litigate

| Decision | Why | Date |
|---|---|---|
| `32422cd` (engine guard) **stays** | tested, 5 cases, Zafiro has it in HANDOFF/MANUAL | 6 Nov |
| ep01 ships **9:16** as built | plan carries no `ratio`; both H3 graphs pin 768x1344 | 12 Nov |
| No cross-dissolves in pitch films | owner | 12 Nov |
| Reviewers are read-only; every finding gets fixed, not logged | owner | 12 Nov |
| Owner business decisions (ask terms, names, roles) are asked, never written by an agent | owner | 12 Nov |

---

## 5. Open, and owned by whom

| Item | Owner | State |
|---|---|---|
| Ananta ask: **₹2 cr split/runway** and the **₹1 cr/month start date** | Aman | content decided in pitch (`f9fe8c4`), commercial split **not** |
| Anant**a** vs Ashutosh meeting outcome | Aman | **unknown — no tool can answer this** |
| ep01: listen on phone, confirm voice level | Aman | published, unconfirmed |
| ep01: 16/19 continuity REDO shots | Zafiro | documented `FACTORY_MANUAL` g16; not started |
| ep01: 16:9 vs shipped 9:16 | Zafiro | documented `FACTORY_MANUAL` g15; not started |
| `namo-studio` 9 unpushed commits | us | local only, team cannot see them |
| `namoApp` 3 uncommitted doc edits (AGENTS/CLAUDE/HANDOFF) | us | block the 267-commit pull |
| Zafiro competitor-app dossier (pilot) | Zafiro | planned only, never started |

---

## 6. Doc map — which file owns which truth

| File | Owns |
|---|---|
| `C:/Projects/STATE.md` (this) | the cross-project summary, verified numbers |
| `namo-studio/FACTORY_MANUAL.md` | how to run the content factory, gaps g1-g16 |
| `namo-studio-engine/HANDOFF.md` | engine pointer + engine notes |
| `namoApp/HANDOFF.md` | the app changelog (team writes it daily) |
| `rubans-app-pitch/pitch/README.md` | how to rebuild the investor film |
| `namo-studio/HANDOFF-2026-11-08.md` | factory history up to 8 Nov — history, not current |

New summary files rot. Extend the row that owns the fact instead.

---

## 7. The rerun rule

Before touching anything: run the `check` column. If it disagrees with this file, **the repo wins**
and this file gets corrected in the same turn.

No agent may claim a number it has not measured this session. `[INFERENCE]` marks a guess that is
labelled as one.
