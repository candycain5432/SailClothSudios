# SailCloth Studios

Website for SailCloth Studios, a studio that designs and builds websites for small businesses.

Plain HTML, CSS and JavaScript. There's no build step, so it can be hosted anywhere that serves static files (GitHub Pages, Netlify, etc.).

## What's here
- `index.html`, `styles.css`, `script.js`: the main site. The sailboat moves and the background darkens as you scroll.
- `demos/`: three working sample sites linked from the "Work" section (food truck, church, barbershop). Orders, bookings and forms are simulated.
- `img/previews/`: screenshots of the demo sites used on the cards.

## Preview locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Before going live
The contact form doesn't send anything yet. It shows a thank-you message only. Connect it to a form service (such as Formspree or Netlify Forms) to receive messages.
