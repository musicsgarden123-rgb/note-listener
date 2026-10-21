# Note Listener (prototype)

A basic web app that:
- **plays a note** through your speakers, and
- **listens** through your microphone and shows the note, frequency, tuning, clarity and loudness.

Click a note to hear it. That note becomes the target, and the app shows **✓ Match!** when you play it back.

It's plain HTML and JavaScript, with no build step and no dependencies. Audio is processed only in your browser; nothing is recorded or uploaded.

## Run it
Browsers only allow the microphone on `https://` or `http://localhost`, so serve the folder rather than opening the file directly. From the project root:

```
python -m http.server 8000 --directory app
```

Then open http://localhost:8000 in Chrome, Edge, Firefox or Safari and click **Start**.

## Tips
- **Self-test without an instrument:** tick "Listen while the app is playing" and click a note. The mic will pick up the app's own note from your speakers. Use a sine or triangle sound and turn the volume up.
- **Headphones** stop the app's notes from reaching the mic.
- **Low notes** on a laptop mic can be read an octave too high or too low. The app tells you when you have the right note name in the wrong octave.

## Files
| File | What it does |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styles (light and dark) |
| `main.js` | Starts audio, connects the mic, plays notes, updates the display |
| `pitch.js` | YIN pitch detection and note/frequency helpers |
