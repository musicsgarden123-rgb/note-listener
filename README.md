# Note Listener (prototype)

A basic web app that:
- shows a **full 88-key piano** (A0 to C8) that scrolls sideways,
- **plays a note** through your speakers when you click a key, and
- **listens** through your microphone, lights up the key you're playing (the glow grows with loudness), and shows the note, frequency, tuning, clarity and loudness.

Click a key to hear it. That key becomes the target (blue). The key you play lights up orange, and turns green with **✓ Match!** when you hit the target.

It's plain HTML and JavaScript, with no build step and no dependencies. Audio is processed only in your browser; nothing is recorded or uploaded.

## Run it
Browsers only allow the microphone on `https://` or `http://localhost`, so serve the folder rather than opening the file directly. In a terminal, run:

```
python -m http.server 8000 --directory "C:\Users\Carlson\Documents\Source Code\SR Project\app"
```

Then open http://localhost:8000 in Chrome, Edge, Opera, Firefox or Safari and click **Start**. Keep the terminal open while you use the app.

## Controls
- **Sound:** soft (triangle), pure (sine) or buzzy (square).
- **Key size:** make the keys bigger or smaller. At the smallest size, most of the keyboard fits on a laptop screen.
- **Scroll to the note I play:** when you play a note that's off screen, the keyboard scrolls to it.
- **Go to middle C:** jumps back to C4 (marked with a small blue dot).

## Tips
- **Self-test without an instrument:** tick "Listen while the app is playing" and click a key. The mic will pick up the app's own note from your speakers. Use a sine or triangle sound and turn the volume up.
- **Headphones** stop the app's notes from reaching the mic.
- **Low notes** on a laptop mic can be read an octave too high or too low, and laptop speakers can barely play the bottom octave. The app tells you when you have the right note name in the wrong octave.

## Files
| File | What it does |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styles (light and dark), including the piano |
| `main.js` | Starts audio, connects the mic, builds the piano, plays notes, updates the display |
| `pitch.js` | YIN pitch detection (A0 to C8) and note/frequency helpers |
