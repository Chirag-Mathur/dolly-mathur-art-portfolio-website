# Royal Painter Portfolio (Book Flip)

A royal-themed portfolio-book frontend for a painter.

## Run

```bash
cd /Users/chiragmathur/Projects/painter-showcase
npm start
```

Open `http://localhost:3000`.

## Auto image loading

- Put painting files in `/images/paintings`.
- Supported: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.gif`.
- The gallery automatically reads all files in that folder via `/api/paintings`.

## Configure each painting (JSON)

Edit `/data/paintings-meta.json`.

Format:

```json
{
  "your-file-name.jpg": {
    "title": "Your title",
    "description": "Your description",
    "price": "₹15,000",
    "medium": "Oil on canvas",
    "year": "2026"
  }
}
```

- `title`: optional (auto-generated from filename if omitted)
- `description`: optional
- `price`: optional
- `medium`: optional
- `year`: optional

## Experience

- Single-page portfolio book at `/index.html`
- First page is artist contact information
- Next pages are near-fullscreen painting pages
- Small details box on each painting page (toggle by clicking the painting)
- Left/right arrows fixed on screen sides and vertically centered
- Header has one icon that opens a Hall of Fame thumbnail page
- Hall of Fame thumbnails use ornate framed borders
- PowerPoint-like book flip page transition animation
