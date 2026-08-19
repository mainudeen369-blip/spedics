/**
 * SPEDICS Institute - Data loader & app logic
 * All content loads dynamically from /data/*.json
 */

const DATA_BASE = 'data';

let SITE_SETTINGS = {
  displayFees: false,
  feeContactMessage: 'Contact us for fee details'
};

function loadSiteSettings(site, fees) {
  const displayFees = typeof site?.displayFees === 'boolean'
    ? site.displayFees
    : typeof fees?.displayFees === 'boolean'
      ? fees.displayFees
      : false;
  SITE_SETTINGS = {
    displayFees,
    feeContactMessage: site?.feeContactMessage || fees?.contactMessage || 'Contact us for fee details'
  };
  window.SITE_SETTINGS = SITE_SETTINGS;
  return SITE_SETTINGS;
}

function feesVisible() {
  return !!SITE_SETTINGS.displayFees;
}

function feeContactCopy() {
  return SITE_SETTINGS.feeContactMessage;
}

function maskFeeText(text) {
  if (text == null) return text;
  const str = String(text);
  if (feesVisible()) return str;
  if (/₹/.test(str) || (/\bfees?\b/i.test(str) && /\d[,.]?\d/.test(str))) {
    return feeContactCopy();
  }
  return str;
}

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
    'Montessori Teacher': 'badge-premium',
    'Montessori Educator': 'badge-premium',
    'Child Development Practitioner': 'badge-popular',
    'Special Education Practitioner': 'badge-premium',
    'Phonics Educator': 'badge-popular',
    'School Administrator': 'badge-premium',
    'Pre-Primary Coordinator': 'badge-popular',
    'Nutrition Educator': 'badge-new',
    'Computer Educator': 'badge-essential',
    'Vedic Maths Educator': 'badge-skill',
    'English Educator': 'badge-language',
    'Hindi Educator': 'badge-language',
    'Tamil Educator': 'badge-language',
    'Telugu Educator': 'badge-language'
  };
  return map[badge] || 'badge-role';
}

function applyFeeData(course, fees) {
  if (!course || !fees) return course;
  const fallback = fees.default || {};
  const extra = (fees.courses && fees.courses[course.id]) || {};
  return {
    ...course,
    duration: extra.duration || course.duration || fallback.duration,
    fee: extra.fee || course.fee || fallback.fee,
    feeAmount: extra.feeAmount ?? course.feeAmount,
    schedule: extra.schedule || course.schedule,
    packages: extra.packages || course.packages || fallback.packages
  };
}

function renderCourseCard(course) {
  const meta = feesVisible() && course.fee
    ? `${course.duration} · ${course.fee}`
    : `${course.duration}${course.fee ? ' · ' + feeContactCopy() : ''}`;
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
          <span style="font-size:0.8rem;color:var(--text-muted)">${meta}</span>
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
  const answer = feesVisible() && item.answerWithFees ? item.answerWithFees : maskFeeText(item.answer);
  return `
    <div class="faq-item" data-faq="${index}">
      <button class="faq-question" aria-expanded="false">
        ${item.question}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${answer}</div>
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
              <p><strong>What to check:</strong> ${maskFeeText(item.detail)}</p>
              <p class="guide-spedics-note"><strong>At SPEDICS:</strong> ${maskFeeText(item.spedics)}</p>
            </div>`).join('')}
        </div>
      </section>`;
  }

  if (section.type === 'list') {
    return `
      <section class="guide-block">
        <h2>${section.heading}</h2>
        <ul class="guide-list">${section.items.map((item) => `<li>${maskFeeText(item)}</li>`).join('')}</ul>
      </section>`;
  }

  if (section.type === 'table') {
    return `
      <section class="guide-block">
        <h2>${section.heading}</h2>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead><tr>${section.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${section.rows.map((row) => `<tr>${row.map((cell) => `<td>${maskFeeText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
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

function populateFeeCourseSelect(courses, selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = courses.filter(Boolean).map((c) =>
    `<option value="${c.id}">${c.title}</option>`
  ).join('');
}

function getCourseFeeOptions(courseId, fees) {
  if (!fees) return [];
  const extra = (fees.courses && fees.courses[courseId]) || {};
  if (extra.packages?.length) return extra.packages;
  if (extra.feeAmount != null) {
    return [{
      name: 'Standard',
      duration: extra.duration || '',
      fee: extra.feeAmount,
      feeLabel: extra.fee
    }];
  }
  return fees.default?.packages || [];
}

function formatFeeLabel(pkg, symbol) {
  if (pkg.feeLabel) return pkg.feeLabel;
  const sym = symbol || '₹';
  return `${sym}${Number(pkg.fee).toLocaleString('en-IN')}`;
}

function initMarquee(messages) {
  const track = document.getElementById('admission-marquee');
  if (!track || !messages?.length) return;
  const items = messages.map((m) => `<span class="marquee-item">${m}</span>`).join('');
  track.innerHTML = `<div class="marquee-group">${items}</div><div class="marquee-group" aria-hidden="true">${items}</div>`;
}

async function initSiteMarquee() {
  const track = document.getElementById('admission-marquee');
  if (!track) return;
  try {
    const [admissions, site, fees] = await Promise.all([
      fetchJSON('admissions.json'),
      fetchJSON('site.json').catch(() => null),
      fetchJSON('fees.json').catch(() => null)
    ]);
    loadSiteSettings(site, fees);
    const messages = (admissions.marquee || []).filter((m) => feesVisible() || !/₹/.test(String(m)));
    initMarquee(messages);
  } catch (err) {
    console.warn('Could not load admission marquee:', err);
  }
}

function initFeeCalculator(courses, fees, site) {
  const courseSelect = document.getElementById('calc-course');
  const durationSelect = document.getElementById('calc-duration');
  const modeSelect = document.getElementById('calc-mode');
  const costEl = document.getElementById('calc-cost');
  const totalEl = document.getElementById('calc-total');
  const applyBtn = document.getElementById('calc-apply');
  if (!courseSelect || !durationSelect || !costEl || !totalEl) return;

  populateFeeCourseSelect(courses, courseSelect);
  const symbol = fees.currencySymbol || '₹';

  function refreshDurationOptions() {
    const options = getCourseFeeOptions(courseSelect.value, fees);
    durationSelect.innerHTML = options.map((pkg, i) => {
      const label = pkg.name ? `${pkg.name} — ${pkg.duration}` : pkg.duration;
      return `<option value="${i}">${label}</option>`;
    }).join('');
    updateCostDisplay();
  }

  function updateCostDisplay() {
    const options = getCourseFeeOptions(courseSelect.value, fees);
    const idx = parseInt(durationSelect.value, 10) || 0;
    const pkg = options[idx];
    if (!feesVisible()) {
      const copy = feeContactCopy();
      costEl.textContent = copy;
      totalEl.textContent = copy;
      costEl.classList.add('fee-display--contact');
      totalEl.classList.add('fee-display--contact');
      return;
    }
    costEl.classList.remove('fee-display--contact');
    totalEl.classList.remove('fee-display--contact');
    if (!pkg) {
      costEl.textContent = '—';
      totalEl.textContent = '—';
      return;
    }
    const label = formatFeeLabel(pkg, symbol);
    costEl.textContent = label;
    totalEl.textContent = label;
  }

  courseSelect.addEventListener('change', refreshDurationOptions);
  durationSelect.addEventListener('change', updateCostDisplay);

  applyBtn?.addEventListener('click', () => {
    const courseTitle = courseSelect.options[courseSelect.selectedIndex]?.text || '';
    window.open(whatsappUrl(whatsappPhone(site), enquiryWhatsAppMessage(site, courseTitle)), '_blank', 'noopener');
  });

  refreshDurationOptions();
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

function whatsappPhone(site) {
  const raw = site?.contact?.whatsapp || site?.contact?.phone || '7708743942';
  const digits = String(raw).replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

function whatsappUrl(phone, text) {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function enquiryWhatsAppMessage(site, courseTitle) {
  const base = site?.whatsappEnquiryMessage
    || "I'm interested in joining this teacher training course. Please share the course details, fees, and admission process.";
  if (!courseTitle) return base;
  return base.replace('this teacher training course', `*${courseTitle}*`);
}

function defaultWhatsAppMessage(site) {
  return enquiryWhatsAppMessage(site);
}

function courseApplyMessage(course, site) {
  return enquiryWhatsAppMessage(site, course?.title);
}

function courseCounsellorMessage(course, site) {
  return enquiryWhatsAppMessage(site, course?.title);
}

function mailtoUrl(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function wireLink(id, url, extra = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('href', url);
  if (extra.target) el.setAttribute('target', extra.target);
  if (extra.rel) el.setAttribute('rel', extra.rel);
}

function setupCourseApplyLinks(site, course) {
  const phone = whatsappPhone(site);
  const applyText = courseApplyMessage(course, site);
  const counsellorText = courseCounsellorMessage(course, site);
  const email = site.contact?.email || 'Spedicsmont@gmail.com';
  const applyWa = whatsappUrl(phone, applyText);
  const counsellorWa = whatsappUrl(phone, counsellorText);
  const applyMail = mailtoUrl(email, `Course Enquiry – ${course.title}`, applyText.replace(/\*/g, ''));

  wireLink('href-course-apply-whatsapp', applyWa, { target: '_blank', rel: 'noopener' });
  wireLink('href-course-apply-email', applyMail);
  wireLink('href-course-counsellor', counsellorWa, { target: '_blank', rel: 'noopener' });
  setupWhatsApp(site, counsellorText);
}

function buildApplicationWhatsAppMessage(form, site) {
  const fd = new FormData(form);
  const courseTitle = fd.get('course') || '';
  const lines = [
    enquiryWhatsAppMessage(site, courseTitle),
    '',
    `*Full Name:* ${fd.get('fullName') || '-'}`,
    `*Mobile:* ${fd.get('mobile') || '-'}`,
    `*WhatsApp:* ${fd.get('whatsapp') || fd.get('mobile') || '-'}`,
    `*Email:* ${fd.get('email') || '-'}`,
    `*Qualification:* ${fd.get('qualification') || '-'}`,
    `*City:* ${fd.get('city') || '-'}`,
    `*Preferred Mode:* ${fd.get('mode') || '-'}`
  ];
  const message = (fd.get('message') || '').trim();
  if (message) lines.push(`*Message:* ${message}`);
  lines.push('', 'Sent from SPEDICS website enquiry form.');
  return lines.join('\n');
}

function setupWhatsApp(site, customMessage) {
  const phone = whatsappPhone(site);
  const text = customMessage || defaultWhatsAppMessage(site);
  const url = whatsappUrl(phone, text);
  ['href-whatsapp', 'href-float-whatsapp'].forEach((id) => {
    setAttr(id, url);
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }
  });
  document.body.dataset.whatsappPhone = phone;
  return phone;
}

function initForm(site) {
  const form = document.getElementById('apply-form');
  if (!form || !site) return;

  const phone = whatsappPhone(site);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const text = buildApplicationWhatsAppMessage(form, site);
    window.open(whatsappUrl(phone, text), '_blank', 'noopener');
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

    loadSiteSettings(site, fees);

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
    setupWhatsApp(site);
    wireLink(
      'href-faq-whatsapp',
      whatsappUrl(whatsappPhone(site), enquiryWhatsAppMessage(site)),
      { target: '_blank', rel: 'noopener' }
    );
    initForm(site);
    setAttr('href-float-call', `tel:${site.contact.phone}`);

    // Hero
    setText('data-hero-badge', site.hero.badge);
    setText('data-hero-title', site.hero.title);
    setText('data-hero-subtitle', site.hero.subtitle);
    const heroTags = document.getElementById('hero-highlights');
    if (heroTags) heroTags.innerHTML = site.hero.highlights.map((h) => `<span class="hero-tag">${h}</span>`).join('');

    // Welcome & about blocks
    if (about.welcomeNote) {
      setText('data-welcome-label', about.welcomeNote.title || 'Welcome to SPEDICS');
      setText('data-welcome-heading', about.welcomeNote.heading || site.tagline);
      setText('data-welcome-text', about.welcomeNote.text || about.intro);
    } else {
      setText('data-welcome-text', about.intro);
    }
    if (about.whoWeAre) {
      setText('data-who-title', about.whoWeAre.title || 'Who We Are');
      setText('data-who-text', about.whoWeAre.text || about.intro);
    } else {
      setText('data-who-text', about.intro);
    }
    if (about.founderMessage) {
      setText('data-founder-title', about.founderMessage.title || 'Message from the Founder');
      setText('data-founder-text', about.founderMessage.text || '');
      setText('data-founder-name', about.founderMessage.name ? `— ${about.founderMessage.name}` : '');
    }

    setText('data-vision', about.vision.text);
    setText('data-mission', about.mission.text);
    const whyGrid = document.getElementById('why-grid');
    if (whyGrid) whyGrid.innerHTML = about.whyChoose.map(renderWhyItem).join('');

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

    // Courses (single list — no duplicate featured + all)
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

    // Client request: remove the certificates card/content from the Recognition section on the homepage.
    // Affiliations remain dynamic via `data/affiliations.json`.
    const certGrid = document.getElementById('certificates-grid');
    if (certGrid) certGrid.innerHTML = '';

    const affList = document.getElementById('affiliation-list');
    if (affList) {
      affList.innerHTML = affiliations.affiliations.map((a) => `
        <div class="affiliation-item reveal">
          <img class="affiliation-logo${a.logo.includes('official-seal') ? ' affiliation-logo--contain' : ''}" src="${a.logo}" alt="${a.name} logo" loading="lazy">
          <div>
            <strong>${a.name}</strong>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem">
              Affiliation No. ${a.affiliationNo} · Period ${a.period}
            </p>
          </div>
        </div>`).join('');
    }

    const affStrip = document.getElementById('affiliation-strip');
    if (affStrip) {
      affStrip.innerHTML = affiliations.affiliations.map((a) => `
        <div class="affiliation-strip-item reveal">
          <img src="${a.logo}" alt="${a.name}" loading="lazy">
          <span>${a.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim()}</span>
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
    initFeeCalculator(courses, fees, site);

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
    loadSiteSettings(site, fees);
    const course = applyFeeData(courseRaw, fees);

    document.title = `${course.title} | ${site.shortName}`;

    initCourseSEO(course, site);

    setText('data-course-title', course.title);
    setText('data-course-title-heading', course.title);
    setText('data-course-desc', course.description);
    setAttr('src-course-image', course.image, 'src');
    setText('data-course-duration', course.duration);
    setText('data-course-eligibility', course.eligibility);
    setText('data-course-fee', feesVisible() ? (course.fee || '—') : feeContactCopy());
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
        packagesBox.innerHTML = '<h3>Course Packages</h3>' + course.packages.map((p) => `
          <div class="package-item">
            <strong>${p.name}</strong>
            <span>${p.duration}</span>
            ${feesVisible() ? `<span>${p.feeLabel || p.fee}</span>` : `<span>${feeContactCopy()}</span>`}
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
    setupCourseApplyLinks(site, course);
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

    loadSiteSettings(site, fees);

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
    setupWhatsApp(site);
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
  initImageFallbacks();
  initSiteMarquee();

  if (document.body.dataset.page === 'home') initHomePage();
  else if (document.body.dataset.page === 'course') initCoursePage();
  else if (document.body.dataset.page === 'guide') initGuidePage();
});
