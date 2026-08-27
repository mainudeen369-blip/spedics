/** Homepage section ids match public/index.html section element ids. Labels match on-page titles. */

export type HomepageSectionDef = {
  id: string;
  label: string;
};

/** Default order: Hero → Welcome → Vision & Mission → … */
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionDef[] = [
  { id: 'home', label: 'Hero Banner' },
  { id: 'welcome', label: 'Welcome to SPEDICS' },
  { id: 'vision-mission', label: 'Vision & Mission' },
  { id: 'about', label: 'Who We Are' },
  { id: 'why-choose', label: 'Why Choose SPEDICS?' },
  { id: 'certificates', label: 'Recognition & Affiliation' },
  { id: 'modes', label: 'Modes of Training' },
  { id: 'nature-training', label: 'Nature of Training' },
  { id: 'who-can-join', label: 'Who Can Join?' },
  { id: 'careers', label: 'Career Opportunities' },
  { id: 'courses', label: 'Courses' },
  { id: 'fees', label: 'Course Enquiry' },
  { id: 'faq', label: 'Frequently Asked Questions' },
  { id: 'testimonials', label: 'Student Testimonials' },
  { id: 'affiliation-logos', label: 'Affiliation Logos' },
  { id: 'gallery', label: 'Our Gallery' },
  { id: 'guides', label: 'Teacher Training Guides' },
  { id: 'admission-process', label: 'Admission Process' },
  { id: 'contact', label: 'Contact & Enquire' }
];

export const DEFAULT_HOMEPAGE_SECTION_ORDER = DEFAULT_HOMEPAGE_SECTIONS.map((s) => s.id);

export const HOMEPAGE_SECTIONS_CONTENT_KEY = 'homepage-sections';

export type HomepageSectionsDoc = {
  order: string[];
};

export function defaultHomepageSectionsDoc(): HomepageSectionsDoc {
  return { order: [...DEFAULT_HOMEPAGE_SECTION_ORDER] };
}

/** Merge saved order with known sections; drop unknowns; append any new defaults at end. */
export function normalizeHomepageSectionOrder(order: unknown): string[] {
  const known = new Set(DEFAULT_HOMEPAGE_SECTION_ORDER);
  const seen = new Set<string>();
  const next: string[] = [];

  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id !== 'string' || !known.has(id) || seen.has(id)) continue;
      next.push(id);
      seen.add(id);
    }
  }

  for (const id of DEFAULT_HOMEPAGE_SECTION_ORDER) {
    if (!seen.has(id)) next.push(id);
  }

  return next;
}

export function sectionsFromOrder(order: string[]): HomepageSectionDef[] {
  const byId = new Map(DEFAULT_HOMEPAGE_SECTIONS.map((s) => [s.id, s]));
  return normalizeHomepageSectionOrder(order).map(
    (id) => byId.get(id) || { id, label: id }
  );
}
