/**
 * SPEDICS Institute - Data loader & app logic
 * All content loads dynamically from /data/*.json
 */

const DATA_BASE = 'data';

async function fetchJSON(path) {
  const res = await fetch(`${DATA_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

async function loadCourse(id) {
  return fetchJSON(`courses/${id}.json`);
}

async function loadAllCourses(ids) {
  return Promise.all(ids.map(async (id) => {
    try {
      return await loadCourse(id);
    } catch {
      return null;
    }
  }));
}

function badgeClass(badge) {
  const map = {
    Premium: 'badge-premium',
    Popular: 'badge-popular',
    New: 'badge-new',
    Essential: 'badge-essential',
    Skill: 'badge-skill',
    Language: 'badge-language'
  };
  return map[badge] || 'badge-popular';
}

function applyFeeData(course, fees) {
  if (!course || !fees) return course;
  const fallback = fees.default || {};
  const extra = (fees.courses && fees.courses[course.id]) || {};
  return {
    ...course,
    duration: extra.duration || course.duration || fallback.duration,
    fee: extra.fee || course.fee || fallback.fee,
    schedule: extra.schedule || course.schedule,
    packages: extra.packages || course.packages || fallback.packages
  };
}

function renderCourseCard(course) {
  return `
    <article class="course-card reveal">
      <div class="course-card-image">
        <img src="${course.image}" alt="${course.title}" loading="lazy">
        <span class="course-badge ${badgeClass(course.badge)}">${course.badge}</span>
      </div>
      <div class="course-card-body">
        <h3>${course.title}</h3>
        <p>${course.description}</p>
        <div class="course-card-footer">
          <span style="font-size:0.8rem;color:var(--text-muted)">${course.duration}${course.fee ? ' · ' + course.fee : ''}</span>
          <a href="course.html?id=${course.id}" class="btn btn-primary btn-sm">Read More</a>
        </div>
      </div>
    </article>`;
}

function renderTestimonial(item) {
  return `
    <div class="testimonial-card">
      <p class="testimonial-quote">${item.quote}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar"><img src="${item.avatar}" alt="${item.name}"></div>
        <div>
          <div class="testimonial-name">${item.name}</div>
          <div class="testimonial-meta">${item.location} · ${item.course}</div>
        </div>
      </div>
    </div>`;
}

function renderFAQItem(item, index) {
  return `
    <div class="faq-item" data-faq="${index}">
      <button class="faq-question" aria-expanded="false">
        ${item.question}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${item.answer}</div>
      </div>
    </div>`;
}

async function loadGuides() {
  const index = await fetchJSON('guides/index.json');
  const items = await Promise.all((index.items || []).map((id) => fetchJSON(`guides/${id}.json`)));
  return { title: index.title, subtitle: index.subtitle, items: items.filter(Boolean) };
}

async function loadGuide(id) {
  return fetchJSON(`guides/${id}.json`);
}

function renderGuideCard(guide) {
  return `
    <article class="guide-card reveal">
      <h3><a href="guide.html?id=${guide.id}">${guide.title}</a></h3>
      <p>${guide.metaDescription || guide.intro}</p>
      <a href="guide.html?id=${guide.id}" class="btn btn-outline btn-sm">Read guide</a>
    </article>`;
}

function renderGuideSection(section) {
  if (section.type === 'checklist') {
    return `
      <section class="guide-block">
        <h2>${section.heading}</h2>
        ${section.intro ? `<p class="guide-block-intro">${section.intro}</p>` : ''}
        <div class="guide-checklist">
          ${section.items.map((item) => `
            <div class="guide-check-item">
              <h3>${item.criterion}</h3>
              <p><strong>What to check:</strong> ${item.detail}</p>
              <p class="guide-spedics-note"><strong>At SPEDICS:</strong> ${item.spedics}</p>
            </div>`).join('')}
        </div>
      </section>`;
  }

  if (section.type === 'list') {
    return `
      <section class="guide-block">
        <h2>${section.heading}</h2>
        <ul class="guide-list">${section.items.map((item) => `<li>${item}</li>`).join('')}</ul>
      </section>`;
  }

  if (section.type === 'table') {
    return `
      <section class="guide-block">
        <h2>${section.heading}</h2>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead><tr>${section.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${section.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </section>`;
  }

  return `
    <section class="guide-block">
      <h2>${section.heading}</h2>
      <p>${section.content || ''}</p>
    </section>`;
}

function renderGuideFAQ(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-block">
      <h2>Frequently Asked Questions</h2>
      <div class="guide-faq-list">${items.map(renderFAQItem).join('')}</div>
    </section>`;
}

async function loadGallery() {
  const index = await fetchJSON('gallery/index.json');
  const folders = index.items || [];
  const items = await Promise.all(folders.map(async (folder) => {
    const data = await fetchJSON(`gallery/${folder}/data.json`);
    const file = data.file || data.image;
    return { ...data, folder, src: mediaSrc('gallery', folder, file), sectionTitle: index.title, sectionSubtitle: index.subtitle };
  }));
  return { title: index.title, subtitle: index.subtitle, items: items.filter(Boolean) };
}

function renderCareerCard(role) {
  const icons = { child: '👶', heart: '❤️', chalkboard: '📋', 'book-open': '📖', puzzle: '🧩', building: '🏫', users: '👥', rocket: '🚀' };
  return `
    <div class="career-card reveal">
      <div class="career-icon">${icons[role.icon] || '🎓'}</div>
      <h4>${role.title}</h4>
      <p>${role.text}</p>
    </div>`;
}

function renderModeCard(mode) {
  const icons = { monitor: '💻', school: '🏫', blend: '⚡' };
  return `
    <div class="mode-card reveal">
      <div class="mode-icon">${icons[mode.icon] || '📚'}</div>
      <h3>${mode.title}</h3>
      <p>${mode.description}</p>
      <ul class="mode-features">
        ${mode.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    </div>`;
}

function renderWhyItem(item) {
  const icons = { book: '📚', hands: '🤲', devices: '📱', clipboard: '📝', users: '👥' };
  return `
    <div class="why-item reveal">
      <div class="why-icon">${icons[item.icon] || '✓'}</div>
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>`;
}

function isVideoFile(path) {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(path || '');
}

function isImageFile(path) {
  return /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i.test(path || '');
}

function mediaSrc(collection, folder, file) {
  if (!file) return 'images/placeholders/default.svg';
  if (/^(https?:)?\/\//i.test(file) || file.includes('/')) return file;
  return `${DATA_BASE}/${collection}/${folder}/${file}`;
}

function renderMedia(src, alt, className = 'cert-media') {
  if (isVideoFile(src)) {
    return `<video class="${className}" src="${src}" controls playsinline muted loop preload="metadata" aria-label="${alt}"></video>`;
  }
  if (isImageFile(src)) {
    return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy">`;
  }
  return `<a class="${className}-file" href="${src}" target="_blank" rel="noopener">Open file</a>`;
}

function renderGalleryItem(item, index) {
  return `
    <div class="gallery-item reveal" data-gallery-index="${index}" role="button" tabindex="0" aria-label="View ${item.title}">
      ${renderMedia(item.src, item.title, 'gallery-media')}
      <div class="gallery-overlay">
        <span>${item.title}</span>
        ${item.description ? `<small>${item.description}</small>` : ''}
      </div>
    </div>`;
}

function ensureGalleryLightbox() {
  if (document.getElementById('gallery-lightbox')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="gallery-lightbox" class="gallery-lightbox" hidden aria-hidden="true">
      <div class="gallery-lightbox-backdrop" data-gallery-close></div>
      <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title">
        <button type="button" class="gallery-lightbox-close" data-gallery-close aria-label="Close">&times;</button>
        <button type="button" class="gallery-lightbox-prev" data-gallery-prev aria-label="Previous photo">&lsaquo;</button>
        <button type="button" class="gallery-lightbox-next" data-gallery-next aria-label="Next photo">&rsaquo;</button>
        <div class="gallery-lightbox-media" id="gallery-lightbox-media"></div>
        <div class="gallery-lightbox-content">
          <h3 id="gallery-lightbox-title"></h3>
          <p id="gallery-lightbox-desc"></p>
        </div>
      </div>
    </div>`);
}

let galleryLightboxItems = [];
let galleryLightboxIndex = 0;

function renderLightboxMedia(item) {
  const mediaBox = document.getElementById('gallery-lightbox-media');
  if (!mediaBox) return;

  if (isVideoFile(item.src)) {
    mediaBox.innerHTML = `<video class="gallery-lightbox-video" src="${item.src}" controls playsinline autoplay aria-label="${item.title}"></video>`;
    return;
  }

  if (isImageFile(item.src)) {
    mediaBox.innerHTML = `<img class="gallery-lightbox-image" src="${item.src}" alt="${item.title}">`;
    return;
  }

  mediaBox.innerHTML = `<a class="gallery-lightbox-link" href="${item.src}" target="_blank" rel="noopener">Open file</a>`;
}

function updateGalleryLightbox() {
  const item = galleryLightboxItems[galleryLightboxIndex];
  if (!item) return;

  renderLightboxMedia(item);

  const titleEl = document.getElementById('gallery-lightbox-title');
  const descEl = document.getElementById('gallery-lightbox-desc');
  if (titleEl) titleEl.textContent = item.title || '';
  if (descEl) {
    descEl.textContent = item.description || '';
    descEl.style.display = item.description ? '' : 'none';
  }

  const lightbox = document.getElementById('gallery-lightbox');
  const prevBtn = lightbox?.querySelector('[data-gallery-prev]');
  const nextBtn = lightbox?.querySelector('[data-gallery-next]');
  const showNav = galleryLightboxItems.length > 1;
  if (prevBtn) prevBtn.style.display = showNav ? '' : 'none';
  if (nextBtn) nextBtn.style.display = showNav ? '' : 'none';
}

function openGalleryLightbox(index) {
  if (!galleryLightboxItems.length) return;

  ensureGalleryLightbox();
  galleryLightboxIndex = ((index % galleryLightboxItems.length) + galleryLightboxItems.length) % galleryLightboxItems.length;
  updateGalleryLightbox();

  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  lightbox.hidden = false;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('gallery-lightbox-open');
  lightbox.querySelector('.gallery-lightbox-close')?.focus();
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  lightbox.querySelector('video')?.pause();
  lightbox.hidden = true;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('gallery-lightbox-open');
}

function initGalleryLightbox(items) {
  galleryLightboxItems = items || [];
  ensureGalleryLightbox();

  document.querySelectorAll('.gallery-item[data-gallery-index]').forEach((el) => {
    const index = Number(el.dataset.galleryIndex);
    const open = () => openGalleryLightbox(index);

    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox || lightbox.dataset.bound === '1') return;
  lightbox.dataset.bound = '1';

  lightbox.querySelectorAll('[data-gallery-close]').forEach((el) => {
    el.addEventListener('click', closeGalleryLightbox);
  });

  lightbox.querySelector('[data-gallery-prev]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openGalleryLightbox(galleryLightboxIndex - 1);
  });

  lightbox.querySelector('[data-gallery-next]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openGalleryLightbox(galleryLightboxIndex + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeGalleryLightbox();
    if (e.key === 'ArrowLeft') openGalleryLightbox(galleryLightboxIndex - 1);
    if (e.key === 'ArrowRight') openGalleryLightbox(galleryLightboxIndex + 1);
  });
}

async function loadCertificates() {
  const index = await fetchJSON('certificates/index.json');
  const folders = index.items || [];
  const certs = await Promise.all(folders.map(async (folder) => {
    const data = await fetchJSON(`certificates/${folder}/data.json`);
    const file = data.file || data.image;
    return { ...data, folder, src: mediaSrc('certificates', folder, file) };
  }));
  return certs.filter(Boolean);
}

function renderCertificateCard(cert) {
  return `
    <article class="cert-card reveal">
      ${renderMedia(cert.src, cert.title)}
      <div class="cert-card-body">
        <h3>${cert.title}</h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem">${cert.description || ''}</p>
      </div>
    </article>`;
}

function renderStep(step) {
  return `
    <div class="step-card reveal">
      <div class="step-num">${step.step}</div>
      <h4>${step.title}</h4>
      <p>${step.text}</p>
    </div>`;
}

function populateCourseSelect(courses, selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">Select a course</option>' +
    courses.filter(Boolean).map((c) => `<option value="${c.title}">${c.title}</option>`).join('');
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.header');

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav?.classList.toggle('open');
  });

  document.querySelectorAll('.nav-dropdown > .nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        link.parentElement?.classList.toggle('open');
      }
    });
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      // Keep mobile menu open when expanding/collapsing Courses dropdown
      if (window.innerWidth <= 768 && a.matches('.nav-dropdown > .nav-link')) {
        return;
      }
      nav?.classList.remove('open');
      toggle?.classList.remove('active');
      document.querySelectorAll('.nav-dropdown').forEach((d) => d.classList.remove('open'));
    });
  });
}

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item?.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item?.classList.add('open');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = (el.textContent || '').trim();
        const match = target.match(/^(\d+)(.*)$/);
        if (!match) return;
        const num = parseInt(match[1], 10);
        const suffix = match[2];
        let current = 0;
        const step = Math.ceil(num / 40);
        const timer = setInterval(() => {
          current += step;
          if (current >= num) {
            current = num;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, 30);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => observer.observe(c));
}

function initForm() {
  const form = document.getElementById('apply-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const orig = btn.textContent;
    btn.textContent = 'Submitted! We will contact you soon.';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
      form.reset();
    }, 4000);
  });
}

function initImageFallbacks() {
  const fallbackSrc = 'images/placeholders/default.svg';
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = fallbackSrc;
    });
  });
}

async function initHomePage() {
  try {
    const [site, about, coursesIndex, testimonials, careers, faq, modes, admissions, affiliations, fees] = await Promise.all([
      fetchJSON('site.json'),
      fetchJSON('about.json'),
      fetchJSON('courses/courses-index.json'),
      fetchJSON('testimonials.json'),
      fetchJSON('careers.json'),
      fetchJSON('faq.json'),
      fetchJSON('learning-modes.json'),
      fetchJSON('admissions.json'),
      fetchJSON('affiliations.json'),
      fetchJSON('fees.json')
    ]);

    document.title = `${site.name} | ${site.tagline}`;

    initHomeSEO(site, faq.items);

    const allCourseIds = [...new Set([
      ...coursesIndex.featured,
      ...coursesIndex.categories.flatMap((c) => c.courses)
    ])];
    const courses = (await loadAllCourses(allCourseIds)).filter(Boolean).map((c) => applyFeeData(c, fees));
    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

    // Topbar & contact
    setText('data-phone', site.contact.phone);
    setText('data-email', site.contact.email);
    setAttr('href-phone', `tel:${site.contact.phone}`);
    setAttr('href-email', `mailto:${site.contact.email}`);
    setAttr('href-whatsapp', site.social.whatsapp);
    setAttr('href-float-whatsapp', site.social.whatsapp);
    setAttr('href-float-call', `tel:${site.contact.phone}`);

    // Hero
    setText('data-hero-badge', site.hero.badge);
    setText('data-hero-title', site.hero.title);
    setText('data-hero-subtitle', site.hero.subtitle);
    const heroTags = document.getElementById('hero-highlights');
    if (heroTags) heroTags.innerHTML = site.hero.highlights.map((h) => `<span class="hero-tag">${h}</span>`).join('');

    const heroStats = document.getElementById('hero-stats');
    if (heroStats) {
      heroStats.innerHTML = site.stats.map((s) => `
        <div class="hero-stat">
          <div class="hero-stat-value" data-count>${s.value}</div>
          <div class="hero-stat-label">${s.label}</div>
        </div>`).join('');
    }

    // Stats bar
    const statsBar = document.getElementById('stats-bar');
    if (statsBar) {
      statsBar.innerHTML = site.stats.map((s) => `
        <div class="stat-item reveal">
          <div class="stat-value" data-count>${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
    }

    // About
    setText('data-about-intro', about.intro);
    setText('data-vision', about.vision.text);
    setText('data-mission', about.mission.text);
    const whyGrid = document.getElementById('why-grid');
    if (whyGrid) whyGrid.innerHTML = about.whyChoose.map(renderWhyItem).join('');

    // Montessori
    setText('data-montessori-intro', about.montessori.intro);
    const montList = document.getElementById('montessori-list');
    if (montList) montList.innerHTML = about.montessori.points.map((p) => `<li>${p}</li>`).join('');

    // Who can join
    const joinTags = document.getElementById('join-tags');
    if (joinTags) joinTags.innerHTML = about.whoCanJoin.map((j) => `<span class="join-tag">${j}</span>`).join('');

    // Courses dropdown
    const dropdown = document.getElementById('courses-dropdown');
    if (dropdown) {
      dropdown.innerHTML = courses.map((c) =>
        `<a href="course.html?id=${c.id}" class="nav-dropdown-item">${c.shortTitle || c.title}</a>`
      ).join('');
    }

    // Featured courses
    const featuredGrid = document.getElementById('featured-courses');
    if (featuredGrid) {
      featuredGrid.innerHTML = coursesIndex.featured
        .map((id) => courseMap[id])
        .filter(Boolean)
        .map(renderCourseCard)
        .join('');
    }

    // All courses
    const allGrid = document.getElementById('all-courses');
    if (allGrid) {
      allGrid.innerHTML = courses.map(renderCourseCard).join('');
    }

    // Learning modes
    const modesGrid = document.getElementById('modes-grid');
    if (modesGrid) modesGrid.innerHTML = modes.modes.map(renderModeCard).join('');
    setText('data-practical-title', modes.practicalLearning.title);
    const practicalList = document.getElementById('practical-list');
    if (practicalList) {
      practicalList.innerHTML = modes.practicalLearning.items.map((i) => `<li>${i}</li>`).join('');
    }

    // Certificates — loaded dynamically from data/certificates/<folder>/
    const certificates = await loadCertificates();
    const certGrid = document.getElementById('certificates-grid');
    if (certGrid) certGrid.innerHTML = certificates.map(renderCertificateCard).join('');

    const affList = document.getElementById('affiliation-list');
    if (affList) {
      affList.innerHTML = affiliations.affiliations.map((a) => `
        <div class="affiliation-item reveal">
          <img class="affiliation-logo" src="${a.logo}" alt="${a.name} logo" loading="lazy">
          <div>
            <strong>${a.name}</strong>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem">
              Affiliation No. ${a.affiliationNo} · Period ${a.period}
            </p>
          </div>
        </div>`).join('');
    }

    // Careers
    setText('data-careers-intro', careers.intro);
    const careersGrid = document.getElementById('careers-grid');
    if (careersGrid) careersGrid.innerHTML = careers.roles.map(renderCareerCard).join('');

    // Testimonials
    const testTrack = document.getElementById('testimonials-track');
    if (testTrack) testTrack.innerHTML = testimonials.items.map(renderTestimonial).join('');

    // Gallery — loaded dynamically from data/gallery/<folder>/
    const gallery = await loadGallery();
    setText('gallery-title', gallery.title);
    setText('gallery-subtitle', gallery.subtitle);
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
      galleryGrid.innerHTML = gallery.items.map((item, index) => renderGalleryItem(item, index)).join('');
      initGalleryLightbox(gallery.items);
    }

    // Guides — AI-search / GEO content pages
    const guides = await loadGuides();
    setText('guides-title', guides.title);
    setText('guides-subtitle', guides.subtitle);
    const guidesGrid = document.getElementById('guides-grid');
    if (guidesGrid) guidesGrid.innerHTML = guides.items.map(renderGuideCard).join('');

    // FAQ
    const faqList = document.getElementById('faq-list');
    if (faqList) faqList.innerHTML = faq.items.map(renderFAQItem).join('');

    // Admissions steps
    const stepsGrid = document.getElementById('steps-grid');
    if (stepsGrid) stepsGrid.innerHTML = admissions.steps.map(renderStep).join('');

    // Contact
    setText('data-address', site.contact.address);
    setText('data-contact-phone', site.contact.phone);
    setText('data-contact-email', site.contact.email);
    setText('data-footer-copy', site.footer.copyright);

    populateCourseSelect(courses, document.getElementById('form-course'));

    initFAQ();
    initReveal();
    initCounters();
    initImageFallbacks();
  } catch (err) {
    console.error('Failed to load site data:', err);
  }
}

async function initCoursePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = 'index.html#courses';
    return;
  }

  try {
    const [courseRaw, site, coursesIndex, fees] = await Promise.all([
      loadCourse(id),
      fetchJSON('site.json'),
      fetchJSON('courses/courses-index.json'),
      fetchJSON('fees.json')
    ]);
    const course = applyFeeData(courseRaw, fees);

    document.title = `${course.title} | ${site.shortName}`;

    initCourseSEO(course, site);

    setText('data-course-title', course.title);
    setText('data-course-title-heading', course.title);
    setText('data-course-desc', course.description);
    setAttr('src-course-image', course.image, 'src');
    setText('data-course-duration', course.duration);
    setText('data-course-eligibility', course.eligibility);
    setText('data-course-fee', course.fee);
    setText('data-course-mode', course.mode.join(' / '));
    setText('data-course-badge', course.badge);

    const scheduleRow = document.getElementById('course-schedule-row');
    if (scheduleRow) {
      if (course.schedule) {
        scheduleRow.style.display = '';
        setText('data-course-schedule', course.schedule);
      } else {
        scheduleRow.style.display = 'none';
      }
    }

    const packagesBox = document.getElementById('course-packages');
    if (packagesBox) {
      if (course.packages && course.packages.length) {
        packagesBox.style.display = '';
        packagesBox.innerHTML = '<h3>Fee Packages</h3>' + course.packages.map((p) => `
          <div class="package-item">
            <strong>${p.name}</strong>
            <span>${p.duration}</span>
            <span>${p.feeLabel || p.fee}</span>
          </div>`).join('');
      } else {
        packagesBox.style.display = 'none';
      }
    }

    const badgeEl = document.getElementById('course-badge-el');
    if (badgeEl) {
      badgeEl.className = `course-badge ${badgeClass(course.badge)}`;
      badgeEl.textContent = course.badge;
    }

    const modulesList = document.getElementById('modules-list');
    if (modulesList) {
      modulesList.innerHTML = course.modules.map((m, i) => `
        <div class="module-item">
          <span class="module-num">${String(i + 1).padStart(2, '0')}</span>
          <span>${m}</span>
        </div>`).join('');
    }

    const allIds = coursesIndex.categories.flatMap((c) => c.courses);
    const allCourses = (await loadAllCourses(allIds)).filter(Boolean).map((c) => applyFeeData(c, fees));
    const dropdown = document.getElementById('courses-dropdown');
    if (dropdown) {
      dropdown.innerHTML = allCourses.map((c) =>
        `<a href="course.html?id=${c.id}" class="nav-dropdown-item">${c.shortTitle || c.title}</a>`
      ).join('');
    }
    populateCourseSelect(allCourses, document.getElementById('form-course'));
    const formCourse = document.getElementById('form-course');
    if (formCourse) formCourse.value = course.title;

    setText('data-phone', site.contact.phone);
    setAttr('href-whatsapp', site.social.whatsapp);
    setAttr('href-float-whatsapp', site.social.whatsapp);
    setAttr('href-float-call', `tel:${site.contact.phone}`);

    initReveal();
    initImageFallbacks();
  } catch (err) {
    console.error('Course not found:', err);
    document.getElementById('course-content').innerHTML =
      '<p style="padding:4rem;text-align:center">Course not found. <a href="index.html#courses">Browse all courses</a></p>';
  }
}

async function initGuidePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = 'index.html#guides';
    return;
  }

  try {
    const [guide, site, coursesIndex, fees] = await Promise.all([
      loadGuide(id),
      fetchJSON('site.json'),
      fetchJSON('courses/courses-index.json'),
      fetchJSON('fees.json')
    ]);

    initGuideSEO(guide, site);

    setText('data-guide-title', guide.title);
    setText('data-guide-heading', guide.title);
    setText('data-guide-intro', guide.intro);

    const content = document.getElementById('guide-content');
    if (content) {
      content.innerHTML = [
        ...(guide.sections || []).map(renderGuideSection),
        renderGuideFAQ(guide.faqs)
      ].join('');
    }

    const allIds = coursesIndex.categories.flatMap((c) => c.courses);
    const allCourses = (await loadAllCourses(allIds)).filter(Boolean).map((c) => applyFeeData(c, fees));
    const courseMap = Object.fromEntries(allCourses.map((c) => [c.id, c]));

    const relatedCoursesBox = document.getElementById('guide-related-courses');
    const coursesList = document.getElementById('guide-courses-list');
    if (relatedCoursesBox && coursesList && guide.relatedCourses?.length) {
      relatedCoursesBox.style.display = '';
      coursesList.innerHTML = guide.relatedCourses
        .map((cid) => courseMap[cid])
        .filter(Boolean)
        .map((c) => `<li><a href="course.html?id=${c.id}">${c.shortTitle || c.title}</a></li>`)
        .join('');
    }

    const relatedGuidesBox = document.getElementById('guide-related-guides');
    const guidesList = document.getElementById('guide-guides-list');
    if (relatedGuidesBox && guidesList && guide.relatedGuides?.length) {
      const allGuides = await loadGuides();
      relatedGuidesBox.style.display = '';
      guidesList.innerHTML = guide.relatedGuides
        .map((gid) => allGuides.items.find((g) => g.id === gid))
        .filter(Boolean)
        .map((g) => `<li><a href="guide.html?id=${g.id}">${g.title}</a></li>`)
        .join('');
    }

    const dropdown = document.getElementById('courses-dropdown');
    if (dropdown) {
      dropdown.innerHTML = allCourses.map((c) =>
        `<a href="course.html?id=${c.id}" class="nav-dropdown-item">${c.shortTitle || c.title}</a>`
      ).join('');
    }

    setText('data-phone', site.contact.phone);
    setAttr('href-float-whatsapp', site.social.whatsapp);
    setAttr('href-float-call', `tel:${site.contact.phone}`);

    initFAQ();
    initReveal();
    initImageFallbacks();
  } catch (err) {
    console.error('Guide not found:', err);
    document.querySelector('.guide-layout')?.insertAdjacentHTML('beforebegin',
      '<p style="padding:4rem;text-align:center">Guide not found. <a href="index.html#guides">Browse all guides</a></p>');
  }
}

function setText(id, text) {
  document.querySelectorAll(`[data-bind="${id}"]`).forEach((el) => { el.textContent = text; });
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setAttr(id, value, attr = 'href') {
  document.querySelectorAll(`[data-bind="${id}"]`).forEach((el) => { el.setAttribute(attr, value); });
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initForm();
  initImageFallbacks();

  if (document.body.dataset.page === 'home') initHomePage();
  else if (document.body.dataset.page === 'course') initCoursePage();
  else if (document.body.dataset.page === 'guide') initGuidePage();
});
