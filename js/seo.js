/**
 * SEO helpers — meta tags, Open Graph, Twitter Cards, JSON-LD
 */
const SITE_URL = 'https://spedics.vercel.app';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

function injectJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function initHomeSEO(site) {
  const title = `${site.name} | Teacher Training Chennai`;
  const desc = site.hero.subtitle + ' Online & offline courses in Montessori, child psychology, special education and more.';
  const url = SITE_URL + '/';

  document.title = title;
  setMeta('description', desc);
  setMeta('keywords', 'SPEDICS, teacher training Chennai, Montessori course, child psychology diploma, special education, phonics training, skill development institute, online teacher training India');
  setMeta('robots', 'index, follow');
  setMeta('author', site.name);
  setMeta('geo.region', 'IN-TN');
  setMeta('geo.placename', 'Chennai');

  setCanonical(url);

  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:site_name', site.shortName, 'property');
  setMeta('og:locale', 'en_IN', 'property');
  setMeta('og:image', `${SITE_URL}/images/placeholders/default.svg`, 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', `${SITE_URL}/images/placeholders/default.svg`);

  injectJsonLd('jsonld-org', {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: site.name,
    alternateName: site.shortName,
    url,
    logo: `${SITE_URL}/images/logo.svg`,
    description: desc,
    email: site.contact.email,
    telephone: `+91${site.contact.phone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '4021, 6th Main Road, Ayapakkam',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600077',
      addressCountry: 'IN'
    },
    sameAs: [site.social.facebook, site.social.instagram, site.social.youtube].filter((u) => u && u !== '#'),
    areaServed: 'IN'
  });

  injectJsonLd('jsonld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/index.html#courses`,
      'query-input': 'required name=search_term_string'
    }
  });
}

function initCourseSEO(course, site) {
  const title = `${course.title} | ${site.shortName}`;
  const desc = course.description;
  const url = `${SITE_URL}/course.html?id=${encodeURIComponent(course.id)}`;

  document.title = title;
  setMeta('description', desc);
  setMeta('robots', 'index, follow');
  setCanonical(url);

  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'article', 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:image', `${SITE_URL}/${course.image}`, 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', `${SITE_URL}/${course.image}`);

  injectJsonLd('jsonld-course', {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: site.name,
      sameAs: SITE_URL
    },
    offers: {
      '@type': 'Offer',
      category: 'Educational',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock'
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: course.mode.map((m) => m.toLowerCase()).join(', '),
      courseWorkload: course.duration
    }
  });
}
