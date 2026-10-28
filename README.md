# Note Listener (prototype)

A note-reading drill with a full piano.

- **Grand staff (middle):** one note at a time, treble or bass clef, anywhere from A0 to C8 (white keys only for now).
- **Piano (bottom):** all 88 keys, sized for fingers on a tablet. Middle C has a gold star.
- **Answer** by pressing the right key on screen, or by playing it on a real piano near the mic. A wrong note does nothing; the right one turns green and the next note appears.
- **💡 Hint** lights up the right key (blue, pulsing) and scrolls the piano to it.
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
