# SPEDICS Website — How to Update

This is a static website. **You do not need to edit HTML** for most changes. Edit JSON files and images, then push to GitHub. Vercel will auto-deploy.

## Local preview

```powershell
cd C:\HajaWorkingFolder\oldFiles\Spedics
python -m http.server 8080
```

Open http://localhost:8080

---

## 1. Change phone, email, address

Edit: `data/site.json`

- `contact.phone`
- `contact.whatsapp`
- `contact.email`
- `contact.address`

---

## 2. Change course fees / duration / classes per week

**Easiest:** edit `data/fees.json`

Examples:

- Montessori packages → `courses.montessori-teacher-training.packages`
- Most other courses → Certified 3 months ₹10,000 / Diploma 6 months ₹15,000 (`default.packages`)
- Spoken English fee → `courses.spoken-english.fee` (example: `"₹3,000"`)
- Duration → `courses.spoken-english.duration` (example: `"3 months"`)
- Classes per week → `courses.spoken-english.schedule` (example: `"3 classes per week"`)
- Other courses default range → `default.fee`

You can also edit the same fields inside `data/courses/<course-id>.json`.  
`data/fees.json` overrides those values on the website.

---

## 3. Change course text / modules

Edit: `data/courses/<course-id>.json`

Example file: `data/courses/spoken-english.json`

Change `title`, `description`, `modules`, `eligibility`, `mode`.

---

## 4. Replace course images

1. Put a photo in `images/courses/`
2. Name it same as the course id, e.g. `spoken-english.jpg`
3. In `data/courses/spoken-english.json` set:

```json
"image": "images/courses/spoken-english.jpg"
```

Supported: `.jpg` `.jpeg` `.png` `.webp` `.svg`

---

## 5. Add or replace certificates (image or video)

1. Create a folder: `data/certificates/my-new-certificate/`
2. Put the file inside it, e.g. `certificate.jpg` or `video.mp4`
3. Create `data/certificates/my-new-certificate/data.json`:

```json
{
  "id": "my-new-certificate",
  "title": "Certificate Title",
  "description": "Short description",
  "file": "certificate.jpg"
}
```

4. Add the folder name in `data/certificates/index.json`:

```json
{
  "items": [
    "mmfrc-certification-of-recognition",
    "spedics-institute-official-seal",
    "my-new-certificate"
  ]
}
```

Supported media: images (jpg, png, webp, svg) and video (mp4, webm, mov).

---

## 6. Add or replace gallery photos (image or video)

Photo and caption live in the **same folder**. Name the folder after what the photo shows — you do not need to open the image to know what it is.

1. Create a folder: `data/gallery/classroom-activity-name/`
2. Put the file inside it, e.g. `photo.jpeg` or `clip.mp4`
3. Create `data/gallery/classroom-activity-name/data.json`:

```json
{
  "id": "classroom-activity-name",
  "title": "Classroom Activity Name",
  "description": "Short caption for the website",
  "file": "photo.jpeg",
  "category": "classroom"
}
```

4. Add the folder name in `data/gallery/index.json`:

```json
{
  "items": [
    "principal-office-administration",
    "nursery-place-value-lesson",
    "classroom-activity-name"
  ]
}
```

Supported media: images (jpg, png, webp, svg) and video (mp4, webm, mov).

---

## 7. Change testimonials

Edit `data/testimonials.json`  
Replace dummy names, quotes, and `avatar` image paths.

---

## 8. Change FAQ / About / careers

| What | File |
|------|------|
| About, vision, mission | `data/about.json` |
| FAQ | `data/faq.json` |
| Careers | `data/careers.json` |
| Admissions steps | `data/admissions.json` |
| Affiliations | `data/affiliations.json` |

---

## 9. After you save changes

```powershell
cd C:\HajaWorkingFolder\oldFiles\Spedics
git add -A
git commit -m "Update website content"
git push
```

Vercel publishes automatically from GitHub `main`.

---

## Course IDs (file names)

| ID | Course |
|----|--------|
| montessori-teacher-training | Montessori (Certified / Diploma / PG Diploma) |
| child-psychology-development | Child Psychology |
| special-education | Special Education |
| phonics-early-literacy | Phonics |
| school-administration-management | School Administration |
| pre-primary-school-management | Pre-Primary Management |
| nutrition | Nutrition |
| computer-skills-education | Computer Skills |
| spoken-english | Spoken English |
| spoken-hindi | Spoken Hindi |
| vedic-mathematics | Vedic Mathematics |
| telugu-reading-writing | Telugu |
| tamil-reading-writing | Tamil |
