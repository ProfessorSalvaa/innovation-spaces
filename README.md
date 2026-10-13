# Innovation Orbit + LSHC Experience Arena (Hyderabad)

Kiosk experience for a 1080 x 1920 portrait display (Proto M2). Open `index.html` in Chrome or Edge.
Double-clicking works. For best results serve it, e.g. in VS Code with the Live Server extension.

## Kiosk UI
- The stage remains fixed at 1080 x 1920. Smaller or landscape windows scale and letterbox the portrait experience; there is no desktop reflow.
- The home page uses Apple-inspired translucent glass, bright edge highlights, and Deloitte-green actions over the supplied background videos. A neutral-black overlay darkens the video by 48-64% without dimming the UI; the start screen has a 32-50% tint behind its centred text. Two aligned experience choices retain integrated scene imagery and large titles.
- The top-left monitor button opens the supplied start-screen video with centred "Innovation Experience Centre" and "Click to start" text. It uses the same 1080 x 1920 portrait dimensions and shared scale factor as the home page, including identical letterboxing. Click anywhere or press Escape to return home.
- BG 1 / BG 2 selects the home background. The adjacent pause/play button controls motion. Selection and manual pause are retained while navigating the experiences, but reset on page reload. All videos are muted, loop inline, and pause when inactive or when the browser tab is hidden. Reduced motion starts the home background paused; the start-screen video plays only on explicit request.
- The header separates the start-screen shortcut and wordmark from a single grouped background control. Icon tooltips appear below the controls; playback warnings occupy a separate line above the footer and do not crowd the header.
- Experience screens retain frosted glass and turquoise actions, defined by `--glass`, `--glass-shadow`, and `--action` in `css/app.css`.
- LSHC is branded as **LSHC Experience Arena**, with the sector label **Life Sciences & Healthcare**. Captions and scripts use the new wording; recorded narration still needs to be regenerated separately.
- The selector uses local previews of the actual 3D scenes. Selecting an experience enters it directly, without a second welcome screen.
- Captions are immediately readable; narration still has its own progress indicator and audio toggle. Home returns to the experience selector.
- Hidden screens are inert. Topic navigation supports Left/Right, Home, and End keys; controls stay fixed rather than following pointer parallax. Topic buttons briefly disable during scene transitions.
- Reduced-motion preferences disable CSS animations and transitions. The existing 3D reduced-motion behavior is retained.

## Display style: Normal or Proto (Proto M2)
The home and start screens have a **Normal | Proto** switch (`js/mode.js`, remembered in the browser). Normal is the original dark design. Proto adds `body.proto`, which `css/hologram.css` and `js/proto-theme.js` use to put everything on white: off-white cards with dark text and layered depth shadows, and the 3D scenes re-rendered on white (normal blending, darker colours, soft floor shadow, no bloom). Proto is a transparent display where dark reads as see-through and light reads as solid. Headlines use one Stix Two Text italic word (class `stix`). Normal mode is untouched by these files. Shadow and tap-target values are estimates (`--hx-float`, `--hx-child`, `--hx-inset`; controls are at least 88 px); check them against the Proto guide on the device.

## Verification
Run the hermetic navigation/media-controller tests and local-source branding checks with Node.js 22 or newer:

```sh
node --test --experimental-test-coverage tests/kiosk-ui.test.cjs
```

Browser checks: open `index.html` in Chrome or Edge, enter both experiences, switch all five topics, select hotspots, toggle narration and anatomy layers, start/stop the guided tour, and return Home. Check at 1080 x 1920 and scaled portrait viewports. Glass performance should also be checked on the target Proto M2 hardware.

Media checks: switch both backgrounds, pause/resume, open the start screen, verify the video loops, then return using Click to start and Escape. Confirm inactive videos pause, selection survives entering an experience, and a video error leaves navigation usable. Check reduced-motion mode and hidden-tab playback.

## Folder
- `index.html` : markup (start screen, Innovation Space, LSHC screens)
- `css/base.css`, `css/app.css` : styles
- `js/innovation-space.js` : the Innovation Space (five 3D topics, recorded narration)
- `js/kiosk-ui.js` : shared keyboard navigation, active-screen focus rules, and home-video lifecycle
- `assets/` : local scene previews, Lucide controls, and supplied videos (`start-screen.mp4`, `bg-1.mp4`, `bg-2.mp4`)
- `js/lshc-experience.js` : start screen + the seven LSHC 3D screens (body, molecule, cell, imaging, globe, genome, journey)
- `js/lshc-content.js` : LSHC titles, taglines and all 35 hotspot captions (safe to edit)
- `js/lshc-data.js` : embedded voice clips, anatomy meshes, land mask (do not hand-edit)
- `js/vendor/` : three.js r128 + post-processing, bundled so it works offline
- `audio/` : Innovation Space narration (mp3)
- `audio/lshc/` : the 33 LSHC voice clips as mp3 files, for reference or replacement
- `LSHC-voiceover-script.md` : first-draft script (the final script is in `js/lshc-content.js`)

## Where to change things
- Screen text: `js/lshc-content.js`. The voice will NOT change with the text, it is recorded audio.
- City name: search `Hyderabad` in `index.html`.
- Screen builders in `js/lshc-experience.js`: `buildBody`, `buildMolecule`, `buildCell`, `buildImaging`, `buildGlobe`, `buildGenome`, `buildJourney`.
- Topic accent colours and the simulated live readouts (decorative values, not real data) are `ACC` and `STATS` in the same file. The Precision Medicine and Patient Journey topics have captions only; record narration clips as `genome-0..5` and `journey-0..5` to add voice.
- Idle attract mode starts after 30 seconds without touch.

## Credits and licences
- Videos: user-supplied `Static Screen.mp4`, `BG 1.mp4`, and `BG2.mp4`, copied into `assets/` without modifying the originals. Ensure appropriate rights before distribution.
- Media control icons: Lucide 0.468.0 (ISC License).
- Unused landscape asset: [Unsplash source image](https://images.unsplash.com/photo-1509316785289-025f5b846b35) (`assets/arena-landscape.jpg`, Unsplash License). Retained locally, but no longer displayed on the home page.
- Human anatomy: BodyParts3D, (c) The Database Center for Life Science, licensed CC BY 4.0
  (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Attribution is retained here rather than in the kiosk footer. Geometry was simplified and quantised; the selector preview is a rendered image of that geometry.
  Prepared via the MIT-licensed `ashemag/human-atlas` packaging.
- LSHC voice: Kokoro-82M neural text-to-speech (Apache 2.0), voice `af_heart`.
- World land outline: Natural Earth via `world-atlas` (public domain).
- three.js r128 (MIT).
