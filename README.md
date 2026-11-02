# Note Listener (prototype)

A note-reading drill with a full piano.

- **Grand staff (middle):** one note at a time, treble or bass clef, anywhere from A0 to C8 (white keys only for now).
- **Piano (bottom):** all 88 keys, sized for fingers on a tablet. Middle C has a gold star.
- **Answer** by pressing the right key on screen, or by playing it on a real piano near the mic. A wrong note does nothing; the right one turns green and the next note appears.
- **💡 Hint** lights up the right key (blue, pulsing) and scrolls the piano to it.
- **Drills:** pick a drill to practise only its notes. **＋ New drill** opens the editor: tap keys to add or remove notes (red dots), or add a from–to range; the **Sharp ♯ / Flat ♭** switch picks which black-key names you're adding: A♯3 picked in Sharp and B♭3 picked in Flat are separate questions in the same drill. Each mode only shows dots for its own black keys; the editor lists the others. The drill name fills in from the range (e.g. "A3 to E4") until you type your own. Drills of an octave or less open with bigger keys (70%); wider ones at 50%. Built-in drills can be copied and edited.
- **Sound:** a warm grand piano by default (softer-played Salamander Grand Piano recordings with a touch of extra body), or the soft, pure and buzzy synth sounds. A tap sounds for half a second; holding a key down keeps the note sounding until you let go, like a real piano.
- **Sound details (top):** the live readout (detected note, frequency, tuning, clarity, loudness). It's for testing and will be hidden later; click its title to fold it away.

It's plain HTML and JavaScript with no build step. The grand staff is drawn by [VexFlow](https://www.vexflow.com) 4.2.5 (MIT licence), saved in `vendor/` so the app works offline. Audio is processed only in your browser; nothing is recorded or uploaded.

## Run it
Browsers only allow the microphone on `https://` or `http://localhost`, so serve the folder rather than opening the file directly. In a terminal, run:

```
python -m http.server 8000 --directory "C:\Users\Carlson\Documents\Source Code\SR Project\app"
```

Then open http://localhost:8000 in **one** browser (Opera, Chrome, Edge, Firefox or Safari) and click **Start**. Keep the terminal open while you load the page. Close the tab when you're done, because the app listens to the mic the whole time it's open.

## Getting around the piano
- **Drag the small keyboard strip** above the piano to move along it (the blue box shows what's on screen; the gold key is middle C).
- **Mouse wheel** over the piano scrolls it sideways.
- **★ Middle C** jumps back to C4.
- **Keys** slider makes the keys bigger or smaller.
- **Follow** scrolls the piano to whatever note you play on a real piano.

## Saving drills
When you run the app from this folder, drills are saved in that browser. On the published page, drills are saved to your Claude account.

## Settings
- **Notes:** full piano (A0 to C8), C2 to C6, or C3 to C5. Smaller ranges make the staff bigger.
- **Sound:** soft (triangle), pure (sine) or buzzy (square).
- **Pause listening** turns the mic off; **Resume listening** turns it back on.

## Files
| File | What it does |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styles (light and dark), including the piano |
| `main.js` | Audio, mic, piano, the note quiz, and drawing the grand staff |
| `pitch.js` | YIN pitch detection (A0 to C8) and note/frequency helpers |
| `vendor/` | VexFlow (music notation library) and its licence |
| `samples/piano/` | Warm grand piano recordings, one every three notes (Salamander Grand Piano by Alexander Holm, CC BY 3.0) |
