# SPEDICS Institute — Static Website

Professional static website for **SPEDICS Institute of Skill Development**, inspired by [Global Teacher Training Academy](https://www.globalteachersacademy.com/) with a unique teal & gold design.

## Quick Start

Open `index.html` in a browser, or serve locally:

```powershell
cd C:\HajaWorkingFolder\oldFiles\Spedics
python -m http.server 8080
# Visit http://localhost:8080
```

> Use a local server so JSON data loads correctly (file:// may block fetch).

## Folder Structure

```
Spedics/
├── index.html              # Main landing page
├── course.html             # Dynamic course detail (?id=course-slug)
├── css/styles.css          # Responsive styles & animations
├── js/app.js               # JSON data loader & UI logic
├── data/                   # All editable content (JSON)
│   ├── site.json           # Contact, hero, stats
│   ├── about.json          # Vision, mission, why choose
│   ├── courses/            # One JSON per course
│   ├── certificates/       # Certificate types & sample data
│   ├── testimonials.json
│   ├── gallery.json
│   ├── faq.json
│   └── ...
├── images/
│   ├── logo.svg            # Animated logo
│   ├── courses/            # Course thumbnails (replace with photos)
│   ├── gallery/            # Gallery images
│   └── certificates/
│       ├── course-certificate/
│       │   └── certificate.svg
│       └── certificate-of-achievement/
│           └── certificate.svg
└── ReferDocs/              # Client source documents
```

## Updating Content

1. **Site info** — edit `data/site.json` (phone, email, address)
2. **Courses** — edit `data/courses/{course-id}.json`
3. **Certificates** — edit `data/certificates/*.json` and replace images in matching `images/certificates/` folders
4. **Gallery** — add images to `images/gallery/` and update `data/gallery.json`
5. **Testimonials** — edit `data/testimonials.json`

## Course IDs

| ID | Course |
|----|--------|
| montessori-teacher-training | Diploma in Montessori Teacher Training |
| child-psychology-development | Diploma in Child Psychology & Child Development |
| special-education | Diploma in Special Education |
| phonics-early-literacy | Diploma in Phonics & Early Literacy |
| school-administration-management | Diploma in School Administration & Management |
| pre-primary-school-management | Diploma in Pre-Primary School Management |
| nutrition | Diploma in Nutrition |
| computer-skills-education | Basic Computer Skills |
| spoken-english | Spoken English |
| spoken-hindi | Spoken Hindi |
| vedic-mathematics | Vedic Mathematics |
| telugu-reading-writing | Telugu Reading & Writing |
| tamil-reading-writing | Tamil Reading & Writing |

## Design

- **Colors:** Teal (#0d7377), Gold (#e8a838), Navy (#1a2332)
- **Fonts:** Fraunces (headings), Plus Jakarta Sans (body)
- **Features:** Scroll animations, FAQ accordion, testimonial carousel, responsive nav, floating WhatsApp/call buttons

## Client Reference

Content sourced from `ReferDocs/SPEDICS_Complete_Website_Content_All_Courses.docx`. Placeholder images and dummy testimonials are included — replace with real assets when available.
