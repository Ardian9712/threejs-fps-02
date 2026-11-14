# EMBER FOUNDRY Build Notes

## Game

EMBER FOUNDRY is a Three.js 0.187.0 tactical FPS set in an industrial foundry. The arena has two bomb sites, central and side routes, cover, furnace lighting and Ember/Slag spawn areas. Gameplay includes fixed-step first-person movement, hitscan guns, opposing bots, buy rounds, planting and defusing, HE and smoke grenades, killfeed, HUD, audio cues, tracers, muzzle flashes and a viewmodel.

The game keeps simulation data in one `S` state object. Modules separate state/RNG, world collision and geometry, player movement, weapons, bots, bomb, grenades, rounds, buy logic, effects, HUD, audio, and shot presets. The main loop uses a 1/60-second fixed step; rendering and pooled visual effects are handled separately.

## Session 4 Fixes

- Added `team: 'ember'` to the player and limited player-target selection to Slag bots. The hitscan friendly-fire filter now recognizes the player as Ember.
- Added bounded bot tracer/flash effects and shot events for audio and bot hearing; removed bot hitmarker events.
- Prevented bot firing in screenshot shot mode.
- Made a living player within 8 m of the planted site interrupt defusing.
- Added the camera to the scene so the attached weapon viewmodel is rendered.
- Set normal round timers to 100 seconds; retained the 78-second `shots.js` play snapshot.
- Corrected bot reload accounting so reserve ammunition is consumed.
- Awarded $300 and one kill stat for each bot killed by the player's HE grenade, with killfeed.
- Initialized `buyMessageT`, `roundWinner`, `cameraShot`, and `worldSeed`; clarified buy button keyboard labels.
- Confirmed buy processing runs before simulation. Outside buy phase it returns without consuming actions, after which the weapon step clears them as intended.

## Verification

All changed JavaScript files passed `node --check` after copying to `.mjs` for syntax checking.

Node simulation with local Three stubs:

- 600 fixed steps: 1/6 bots moved; the live round timer decreased from 100 to 90 seconds.
- Slag positioned 5 m from the player: player HP reached 0 and the player died after bot fire. The final logged bot-shot count was 1 because `stepSim` events are retained/handled as a mutable event buffer during simulation.
- Ember-only near the player: 0 Ember shots; player HP remained 100.

## Screenshots

All three are JPEG 1280x720 and under 256 KiB:

- `screenshots/1-start.jpg`: 35,922 bytes; start shot captured with one canvas.
- `screenshots/2-play.jpg`: 22,623 bytes; play shot captured with one canvas.
- `screenshots/3-end.jpg`: 43,028 bytes; end shot captured with one canvas.

The requested image read tool returned “Cannot read image (this model does not support image input)” for all three, so scene composition, readable HUD, bot/tracer visibility, and end banner could not be visually assessed. Browser run had no `pageerror`, but logged one generic 404 resource error; it was not identified. These are remaining screenshot verification gaps.

## Reproducible Build

`main.ts` ran twice with output directories `/tmp/fps02-out-a` and `/tmp/fps02-out-b`; `diff -r` was empty.

- Run A `dossier.json` SHA-256: `6cc78a2ce7c7a3661f4fc735a2d1b8486a466c691e72dffaaa6c2f269fe4c49d`
- Run B `dossier.json` SHA-256: `6cc78a2ce7c7a3661f4fc735a2d1b8486a466c691e72dffaaa6c2f269fe4c49d`
- Source size from `du -sb game/src game/index.html`: 63,021 bytes total.
- Dossier text did not contain “lines not shown”.

## make.fun Check

`makefun check --worktree --transcripts ...` reported `12 passed, 0 failed, 6 skipped, 5 checked at submission`.

- SKIP `prerequisites`: user-side prerequisite confirmation is outside this command.
- PASS `competition_open`: within opening and entry deadline.
- PASS `snapshot`: 31 entries, 2,358,772 bytes, within caps.
- PASS `license_osi`: MIT license recognized.
- PASS `entrypoint`: `main.ts` selects an accepted Node entrypoint.
- SKIP `strategy_note`: not required.
- SKIP `committed_secret`: no env file supplied.
- PASS `transcripts_present`: 3 OpenCode sessions parsed.
- PASS `transcripts_recorded`: all 3 are recorded session logs.
- PASS `thinking_wellformed`: 278 messages, timestamps ordered, 162 tool results paired.
- PASS `thinking_in_window`: all 397 timestamps are within the competition window.
- SKIP `thinking_committed`: no entry signature commits the transcript bundle.
- PASS `thinking_reproduces`: 97.7% of counted lines attributed to transcripts.
- SKIP `thinking_on_task`: harness names no task terms.
- PASS `thinking_turns`: 51 assistant turns with text or thinking.
- PASS `thinking_priced`: 113 usage records priced to known models.
- PASS `thinking_revised`: required files meet revision counts.
- SKIP `thinking_fresh`: no GitHub beacon root is present.
- At submission `repo_public`: requires a public GitHub repository.
- At submission `repo_owner`: requires GitHub owner or `.makefun/owner.json` wallet.
- At submission `repo_created_after_open`: GitHub repository creation must be after competition opening.
- At submission `commit_in_repo`: submitted commit must be pushed to a branch.
- At submission `duplicate_snapshot`: server compares against prior entries.

The requested pruned OpenCode database held three earlier project sessions after excluding unrelated sessions. Bundle dry-run reported one OpenCode database archive with 116 turns; the current session was not yet present in `/session` when collected. Transcript bundle: `/home/hatch/workspace/makefun/threejs-fps-02-ops/transcripts.tar.gz`, 263,004 bytes, SHA-256 `735d6470b04771d8d6df9e4de1bd8da04a8c0543ef560a1202b8900465b4f2a7`.

## Earlier Commits

- `7f45f93` docs: record Ember Foundry build hash
- `ed276ae` threejs-fps-02: Ember Foundry tactical FPS (root commit)

## Session 5

- Replaced the single crossing waypoint cycle with 16 authored waypoints and per-bot west/east/mid ping-pong routes. Route targets initialize near each bot's spawn, and patrol skips a target after 1.5 seconds without sufficient progress. Rush and engage behavior remain separate from patrol routing.
- HUD now hides the bomb bar unless planting, planted, or defusing, and hides the hint outside live non-shot play. Shot mode skips all fixed-step gameplay simulation while rendering and syncing effects/audio/HUD. Added a data favicon, brighter viewmodel and lighting, deterministic play staging, and $4,150 end-shot money.
- Node syntax checks passed for every changed JavaScript module. Simulation (seed 12): in the default 600-step run, Ash moved 1.90 m, Cinder 0.00 m (engage), Slag-1 8.44 m, Slag-2 10.47 m, Slag-3 8.49 m, and Slag-4 0.01 m (engage). Thus 3/6 exceeded 2 m; the two stationary bots entered the intentionally unchanged engage branch, not a blocked patrol waypoint. In a patrol-only diagnostic with the player removed from visibility, 4/6 exceeded 2 m; remaining Cinder/Slag-4 entered engage after spotting opposing bots. A single Slag at 5 m reduced player HP to 0 after 300 steps; an Ember-only nearby bot left HP at 100.
- Re-captured `screenshots/1-start.jpg` (35,574 bytes), `2-play.jpg` (22,872 bytes), and `3-end.jpg` (42,972 bytes). All are JPEG 1280x720 and under 256 KiB. Browser log: one canvas per shot; zero console errors, pageerrors, and HTTP errors. Screenshot images were not visually assessed by this model.
- `main.ts` ran twice into `/tmp/fps02-out-a` and `/tmp/fps02-out-b`; `diff -r` was empty. Both dossier SHA-256 values: `06430ff326138680ef7bef72b1dc8a926c930a3734aced7bf6ce5724c2674fdf`. `game/src` plus `game/index.html`: 64,216 bytes. Dossier had no “lines not shown”.
- Final make.fun check: 11 passed, 1 failed, 6 skipped, 5 checked at submission. `thinking_priced` failed because three discovered Muse app transcripts carried 0 usage rows; the installed environment contains no `muse.db` (`muse-usage` cannot be attached without its original rows). All other applicable checks passed.
- OpenCode `/session` listed five project IDs: `ses_e23d5864affeBrO1zKvAzM1IsO`, `ses_e2400d85cffe164IjOV0T73AuB`, `ses_e23f5faa0ffeQmiMNW4EiJka6C`, `ses_e23ec78ffferk3OOxBH6rrGOY`, and `ses_e23e2f7d7ffegwPp663DGPu8Rx`. Bundle/check parsed five OpenCode sessions from the live DB. The requested pruned DB was inconsistent: its copy showed five before pruning, but after each prune the `happy-island` session row disappeared while the live DB retained it. Transcript bundle `/home/hatch/workspace/makefun/threejs-fps-02-ops/transcripts.tar.gz`: 1,400,037 bytes, SHA-256 `7a19b8cadfd6b3f8e2b37051d45689c2ed441fec1a543e1a0130033ffe64ae4f`; check parsed eight sessions total (five OpenCode and three Muse app).

## Session 6

- Fixed start/play shot camera placement in `game/src/main.js`: each frame now copies player eye position as well as pitch/yaw to the camera. Added `setViewModelVisible` in `game/src/effects.js` and hide the first-person viewmodel for the end overview shot; weapon geometry was unchanged.
- Mechanical Playwright probe results: play camera `[2, 1.62, 8]`, start `[0, 1.62, 14]`, end `[0, 14, 18]`. The viewmodel projected to NDC `[0.37, -0.5]` in start/play and its group was hidden in end. Browser errors: none. These results are mechanical checks, not a visual assessment.
- Re-shot all three JPEGs at 1280x720: `screenshots/1-start.jpg` 38,614 bytes, `2-play.jpg` 25,287 bytes, and `3-end.jpg` 42,512 bytes. All are below 256 KiB; each has a 1280-pixel long side and 720-pixel short side.
- `node --check` passed for both edited JavaScript files. `main.ts` ran twice into separate output directories; the dossier files were byte-identical. Both SHA-256 values: `b18acc959744d41adf35a7988d50005eca4194646d66ea0dd4a457eacf3e08cd`.
- Rebuilt the session DB snapshot from the live SQLite DB and verified the six project sessions, with no Muse sessions. The S3 ID in the session instructions had one fewer `f` than its live DB ID; the bundle uses the verified live ID `ses_e23ec78fffferk3OOxBH6rrGOY`. Bundle dry-run parsed 321 turns. Final make.fun check: 12 passed, 0 failed, 6 skipped, 5 checked at submission; `thinking_priced` passed with 311 usage records.
- Transcript bundle `/home/hatch/workspace/makefun/threejs-fps-02-ops/transcripts.tar.gz`: 759,417 bytes, SHA-256 `ee89fcf70a7bbbc141fa35f9539bf934c20032d90b7ca9f40f4b67ebb0032885`.

## Commit

Session 5 commit hash: `c3a5a2b` (`threejs-fps-02: polish routes, HUD, shot staging`).

Session 6 commit hash: `a13d9e2` (`threejs-fps-02: fix shot camera framing`).
