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
          <span style="font-size:0.8rem;color:var(--text-muted)">${course.duration}</span>
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

function renderGalleryItem(item) {
  return `
    <div class="gallery-item reveal">
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div class="gallery-overlay"><span>${item.title}</span></div>
    </div>`;
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
    const [site, about, coursesIndex, testimonials, gallery, careers, faq, modes, admissions, affiliations, courseCert, achievementCert] = await Promise.all([
      fetchJSON('site.json'),
      fetchJSON('about.json'),
      fetchJSON('courses/courses-index.json'),
      fetchJSON('testimonials.json'),
      fetchJSON('gallery.json'),
      fetchJSON('careers.json'),
      fetchJSON('faq.json'),
      fetchJSON('learning-modes.json'),
      fetchJSON('admissions.json'),
      fetchJSON('affiliations.json'),
      fetchJSON('certificates/mmfrc-certification-of-recognition.json'),
      fetchJSON('certificates/spedics-institute-official-seal.json')
    ]);

    document.title = `${site.name} | ${site.tagline}`;

    initHomeSEO(site);

    const allCourseIds = [...new Set([
      ...coursesIndex.featured,
      ...coursesIndex.categories.flatMap((c) => c.courses)
    ])];
    const courses = (await loadAllCourses(allCourseIds)).filter(Boolean);
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

    // Certificates
    setText('data-cert-course-title', courseCert.title);
    setText('data-cert-course-desc', courseCert.description);
    setAttr('src-cert-course', courseCert.image, 'src');
    setText('data-cert-achieve-title', achievementCert.title);
    setText('data-cert-achieve-desc', achievementCert.description);
    setAttr('src-cert-achieve', achievementCert.image, 'src');

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

    // Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) galleryGrid.innerHTML = gallery.items.map(renderGalleryItem).join('');

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
    const [course, site, coursesIndex] = await Promise.all([
      loadCourse(id),
      fetchJSON('site.json'),
      fetchJSON('courses/courses-index.json')
    ]);

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
    const allCourses = (await loadAllCourses(allIds)).filter(Boolean);
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
});
