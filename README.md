# SHEVENT AFRICA website

Static site: HTML5, CSS3, Bootstrap 5 (CDN), Bootstrap Icons (CDN), vanilla JavaScript.

```
shevent-africa/
├── index.html        page structure and content
├── css/style.css     brand design (loads after Bootstrap)
├── js/script.js      behaviour and CONFIG (edit details here)
├── assets/images/    put real photos and the logo here
└── README.md
```

Open `index.html` in a browser, or serve it: `python3 -m http.server` then visit http://localhost:8000

## Edit in `js/script.js` → `CONFIG`
| Key | Status |
|---|---|
| `whatsappNumber` | Set (2349066524606) |
| `formEndpoint` | EMPTY: paste your Formspree URL, otherwise the form says it is not connected |
| `mapEmbedUrl`, `mapLinkUrl` | TEMPORARY shopping-complex sample, replace with the business location, then delete the note under the map in `index.html` |
| `social` | EMPTY: add full https:// URLs; empty icons stay disabled |

## Still to replace
- Stock photos from Unsplash (hotlinked) → real event photos in `assets/images/`
- `[PLACEHOLDER]` text: about copy, hours, address, domain (canonical and Open Graph tags), logo
- `[REVIEW]` draft copy: hero line, About promise, services intro, event-type options

## Test before launch
Form (real submission), WhatsApp on a phone, every link, mobile menu, gallery filter and lightbox, keyboard navigation.
# SHEVENT
