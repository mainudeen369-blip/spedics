/**
 * SEO / GEO helpers — meta tags, Open Graph, JSON-LD structured data
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

function absUrl(path) {
  if (!path) return `${SITE_URL}/data/certificates/spedics-institute-official-seal/official-seal.jpeg`;
  if (/^(https?:)?\/\//i.test(path)) return path;
  return `${SITE_URL}/${path.replace(/^\//, '')}`;
}

function buildOpeningHours(site) {
  const specs = site.openingHours || [];
  return specs.map((slot) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: slot.days,
    opens: slot.opens,
    closes: slot.closes
  }));
}

function buildAreasServed(site) {
  return (site.areasServed || ['Chennai']).map((name) => ({
    '@type': 'City',
    name
  }));
}

function buildOrgSchema(site, desc) {
  const contact = site.contact || {};
  const geo = site.geo || {};
  const sameAs = [site.social?.facebook, site.social?.instagram, site.social?.youtube]
    .filter((u) => u && u !== '#');

  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': `${SITE_URL}/#organization`,
    name: site.name,
    alternateName: site.shortName,
    url: SITE_URL + '/',
    logo: absUrl(site.logoSeal || site.image || 'data/certificates/spedics-institute-official-seal/official-seal.jpeg'),
    image: absUrl(site.image || site.logoSeal || 'data/certificates/spedics-institute-official-seal/official-seal.jpeg'),
    description: desc,
    email: contact.email,
    telephone: `+91${contact.phone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.streetAddress || '4021, 6th Main Road, Ayapakkam',
      addressLocality: contact.addressLocality || 'Chennai',
      addressRegion: contact.addressRegion || 'Tamil Nadu',
      postalCode: contact.postalCode || '600077',
      addressCountry: contact.addressCountry || 'IN'
    },
    geo: geo.latitude && geo.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude
    } : undefined,
    openingHoursSpecification: buildOpeningHours(site),
    areaServed: buildAreasServed(site),
    sameAs,
    ...(feesVisible(site) ? { priceRange: '₹₹' } : {})
  };
}

function feesVisible(site) {
  if (typeof window !== 'undefined' && window.SITE_SETTINGS && typeof window.SITE_SETTINGS.displayFees === 'boolean') {
    return window.SITE_SETTINGS.displayFees;
  }
  return site?.displayFees === true;
}

function feeContactCopy(site) {
  return (typeof window !== 'undefined' && window.SITE_SETTINGS?.feeContactMessage)
    || site?.feeContactMessage
    || 'Contact us for fee details';
}

function maskFeeForSeo(text, site) {
  if (feesVisible(site) || text == null) return text;
  const str = String(text);
  if (/₹/.test(str) || (/\bfees?\b/i.test(str) && /\d[,.]?\d/.test(str))) {
    return feeContactCopy(site);
  }
  return str;
}

function buildCourseOffers(course, site) {
  if (!feesVisible(site)) {
    return {
      '@type': 'Offer',
      description: feeContactCopy(site),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/course.html?id=${encodeURIComponent(course.id)}`
    };
  }
  if (course.packages?.length) {
    return course.packages.map((pkg) => {
      const price = typeof pkg.fee === 'number'
        ? pkg.fee
        : parseInt(String(pkg.feeLabel || pkg.fee).replace(/[^\d]/g, ''), 10) || undefined;
      return {
        '@type': 'Offer',
        name: pkg.name,
        price,
        priceCurrency: 'INR',
        description: `${pkg.duration}${price ? ` — ₹${price.toLocaleString('en-IN')}` : ''}`,
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/course.html?id=${encodeURIComponent(course.id)}`
      };
    });
  }

  const price = course.feeAmount
    || parseInt(String(course.fee || '').split(/[^\d]/)[0], 10)
    || undefined;

  return {
    '@type': 'Offer',
    price,
    priceCurrency: 'INR',
    description: course.fee,
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/course.html?id=${encodeURIComponent(course.id)}`
  };
}

function injectBreadcrumb(items) {
  injectJsonLd('jsonld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });
}

function injectFAQSchema(items, id = 'jsonld-faq') {
  if (!items?.length) return;
  injectJsonLd(id, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  });
}

function initHomeSEO(site, faqItems) {
  const title = `${site.name} | Teacher Training Chennai`;
  const desc = `${site.hero.subtitle} Online & offline courses in Montessori, child psychology, special education and more. Located in Ayapakkam, Chennai.`;
  const url = SITE_URL + '/';

  document.title = title;
  setMeta('description', desc);
  setMeta('keywords', 'SPEDICS, teacher training Chennai, Montessori course Chennai, teacher training Ayapakkam, child psychology diploma, special education, phonics training, skill development institute');
  setMeta('robots', 'index, follow');
  setMeta('author', site.name);
  setMeta('geo.region', 'IN-TN');
  setMeta('geo.placename', 'Chennai');
  if (site.geo?.latitude && site.geo?.longitude) {
    setMeta('geo.position', `${site.geo.latitude};${site.geo.longitude}`);
    setMeta('ICBM', `${site.geo.latitude}, ${site.geo.longitude}`);
  }

  setCanonical(url);

  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:site_name', site.shortName, 'property');
  setMeta('og:locale', 'en_IN', 'property');
  setMeta('og:image', absUrl(site.image), 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', absUrl(site.image));

  injectJsonLd('jsonld-org', buildOrgSchema(site, desc));

  injectJsonLd('jsonld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/index.html#courses`,
      'query-input': 'required name=search_term_string'
    }
  });

  injectFAQSchema((faqItems || []).map((item) => ({
    ...item,
    answer: feesVisible(site) && item.answerWithFees ? item.answerWithFees : maskFeeForSeo(item.answer, site)
  })), 'jsonld-faq-home');
}

function initCourseSEO(course, site) {
  const title = `${course.title} | ${site.shortName}`;
  const desc = feesVisible(site)
    ? `${course.description} Duration: ${course.duration}. Fee: ${course.fee}. SPEDICS, Ayapakkam, Chennai.`
    : `${course.description} Duration: ${course.duration}. ${feeContactCopy(site)}. SPEDICS, Ayapakkam, Chennai.`;
  const url = `${SITE_URL}/course.html?id=${encodeURIComponent(course.id)}`;

  document.title = title;
  setMeta('description', desc);
  setMeta('robots', 'index, follow');
  setCanonical(url);

  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'article', 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:image', absUrl(course.image), 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', absUrl(course.image));

  injectBreadcrumb([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Courses', url: `${SITE_URL}/index.html#courses` },
    { name: course.title, url }
  ]);

  injectJsonLd('jsonld-course', {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: { '@id': `${SITE_URL}/#organization` },
    offers: buildCourseOffers(course, site),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: course.mode.map((m) => m.toLowerCase()).join(', '),
      courseWorkload: course.duration,
      location: {
        '@type': 'Place',
        name: site.name,
        address: site.contact?.address
      }
    }
  });
}

function initGuideSEO(guide, site) {
  const title = `${guide.title} | ${site.shortName}`;
  const desc = guide.metaDescription || guide.intro;
  const url = `${SITE_URL}/guide.html?id=${encodeURIComponent(guide.id)}`;

  document.title = title;
  setMeta('description', desc);
  setMeta('robots', 'index, follow');
  setCanonical(url);

  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'article', 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:image', absUrl(site.image), 'property');

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', absUrl(site.image));

  injectBreadcrumb([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Guides', url: `${SITE_URL}/index.html#guides` },
    { name: guide.title, url }
  ]);

  injectJsonLd('jsonld-guide', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: desc,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: url,
    about: {
      '@type': 'Thing',
      name: 'Teacher training in Chennai'
    }
  });

  injectFAQSchema((guide.faqs || []).map((item) => ({
    ...item,
    answer: maskFeeForSeo(item.answer, site)
  })), 'jsonld-faq-guide');
}
