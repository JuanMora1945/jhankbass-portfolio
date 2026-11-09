# Jhank Bass — Jhankarlo Bermúdez

Landing page and portfolio for **Jhankarlo Bermúdez (Jhank Bass)**, a bassist and double bassist from Santander de Quilichao (Cauca) based in Cali, Colombia. It promotes his work as a live and session musician and as a bass-line composer, and turns visitors into WhatsApp bookings.

**Live site:** https://jhankbass.netlify.app

## Features

- **Scroll-driven 3D hero**: a stylised 3D bassist modelled in Blender, rendered to a 144-frame transparent WebP sequence and scrubbed on a `<canvas>` while you scroll (eased scrolling, cross-fade between frames, idle groove, pointer tilt).
- **Adaptive loading for slow connections**: a light 540×660 frame set for phones and slow networks (`navigator.connection`, `saveData`), coarse-to-fine loading with limited concurrency, and loading deferred until the page is ready.
- **WhatsApp booking flow**: every call to action opens WhatsApp with a prefilled message; the contact form builds the message from service, genre (with an "Other" option), date and city.
- **In-page video reels**: Instagram reels re-encoded to H.264 and played inline, one at a time.
- **Genre "staff" strip**: the 16 genres he plays scroll across a music staff with a bass (F) clef.
- **SEO**: `ProfilePage`, `Person`, `ProfessionalService` and `FAQPage` JSON-LD, Open Graph and Twitter cards, a sitemap with image and video entries, and local geo meta tags.
- **Responsive and accessible**: designed at desktop and 390 px widths, swipe rows on phones, 4.5:1 text contrast, `prefers-reduced-motion` support, and keyboard-friendly menu, tabs and FAQ.

## Stack

Plain HTML, CSS and JavaScript (no build step). Blender 5 (headless) for the 3D character, `ffmpeg` and `cwebp` for media, Netlify for hosting.

## Project structure

```
index.html        Page markup, meta tags and structured data
styles.css        Styles (tokens, layout, responsive rules)
main.js           Interactions: 3D frame scrubbing, videos, WhatsApp builder, reveals
img/              Optimised WebP photos, video posters and the 3D frame sequences
img/bassist/      900×1100 frames (desktop) and sm/ 540×660 frames (light set)
video/            Reels re-encoded to H.264 MP4
sitemap.xml       Sitemap with image and video entries
netlify.toml      Cache and security headers
build-dist.sh     Copies only the published files into dist/
```

## Run locally

```sh
python3 -m http.server 5173
# open http://localhost:5173
```

## Deploy

```sh
./build-dist.sh
netlify deploy --dir dist --prod
```

## Credits

Photos and videos: [@jhankbass](https://www.instagram.com/jhankbass/).
