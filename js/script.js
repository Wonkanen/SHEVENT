/* ==========================================================================
   SHEVENT AFRICA: interactive features (vanilla JS, no dependencies beyond
   the Bootstrap bundle already loaded in index.html).
   Contents: 0 Config · 1 Header · 2 Navigation · 3 WhatsApp · 4 Gallery
   5 Lightbox · 6 Contact form
   ========================================================================== */
"use strict";

/* 0. CONFIG: the only place client details live. Empty = not supplied yet. */
const CONFIG = {
  whatsappNumber: "2349036100881",   // international format, digits only (+234 906 652 4606)
  whatsappMessage: "Hello SHEVENT AFRICA, I would like to make an enquiry about an event.",
  formEndpoint: "",      // [PLACEHOLDER] e.g. "https://formspree.io/f/xxxxxxxx" (from your Formspree form)
  formExtraFields: {},   // extra hidden fields some services need, e.g. { access_key: "..." }
  // TEMPORARY sample location (a shopping complex), NOT the company's address.
  // Replace both values with the business location when it is provided.
  mapEmbedUrl: "https://www.google.com/maps?q=Ikeja+City+Mall,+Obafemi+Awolowo+Way,+Ikeja,+Lagos,+Nigeria&output=embed",
  mapLinkUrl: "https://www.google.com/maps/search/?api=1&query=Ikeja+City+Mall%2C+Obafemi+Awolowo+Way%2C+Ikeja%2C+Lagos",
  social: {              // [PLACEHOLDER] full https:// URLs of the official accounts; empty = disabled icon
    instagram: "", facebook: "", x: "", tiktok: "", linkedin: "", youtube: ""
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.add("js");

/* 1. HEADER: solid background once the page is scrolled -------------------- */
function initHeader() {
  const header = $(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* 2. NAVIGATION: smooth scroll, offset for fixed header, close mobile menu.
      Bootstrap's offcanvas already handles toggle, focus trap and Esc. ------ */
function initNavigation() {
  const menu = $("#mainNav");

  function goTo(hash) {
    const target = $(hash);
    if (!target) return;
    // The fixed-header offset comes from `scroll-padding-top` in style.css.
    target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (hash === "#" || link.getAttribute("aria-disabled") === "true") {
      event.preventDefault();          // placeholder links do nothing
      return;
    }
    if (!$(hash)) return;
    event.preventDefault();

    const menuOpen = menu && menu.classList.contains("show") && window.bootstrap;
    if (menuOpen) {
      // Scroll only after the panel has closed (it locks page scrolling while open)
      menu.addEventListener("hidden.bs.offcanvas", () => goTo(hash), { once: true });
      bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    } else {
      goTo(hash);
    }
  });
}

/* 3. WHATSAPP: click-to-chat links and floating button --------------------- */
function whatsappDigits() {
  return CONFIG.whatsappNumber.replace(/\D/g, "");
}

function buildWhatsAppUrl(text) {
  return `https://wa.me/${whatsappDigits()}?text=${encodeURIComponent(text)}`;
}

/* Message for the contact-card button: includes whatever the visitor has typed */
function enquiryMessage() {
  const form = $("#enquiry-form");
  const value = (name) => (form && form.elements[name] && form.elements[name].value ? form.elements[name].value.trim() : "");
  const services = form ? $$('input[name="services"]:checked', form).map((box) => box.value) : [];
  const lines = [CONFIG.whatsappMessage];
  const add = (label, text) => { if (text) lines.push(`${label}: ${text}`); };
  add("Name", value("name"));
  add("Event type", value("eventType"));
  add("Services", services.join(", "));
  add("Event date", value("date"));
  add("Location", value("location"));
  add("Details", value("message"));
  return lines.join("\n");
}

function initWhatsApp() {
  const links = $$(".js-whatsapp");
  if (!whatsappDigits()) {
    // No number yet: links keep their safe fallback (#contact) rather than a broken URL.
    console.warn("SHEVENT AFRICA: set CONFIG.whatsappNumber in js/script.js to enable WhatsApp links.");
  } else {
    links.forEach((link) => {
      link.href = buildWhatsAppUrl(CONFIG.whatsappMessage);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      if (link.closest(".whatsapp-card")) {
        link.addEventListener("click", () => { link.href = buildWhatsAppUrl(enquiryMessage()); });
      }
    });
  }

  // Floating button appears once the hero has scrolled out of view
  const float = $(".whatsapp-float");
  const hero = $("#home");
  if (!float) return;
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => float.classList.toggle("is-visible", !entry.isIntersecting))
      .observe(hero);
  } else {
    float.classList.add("is-visible");
  }
}

/* 4. GALLERY: category filter ----------------------------------------------
      Categories come from the HTML: chips use data-filter, items use data-category. */
function initGallery() {
  const items = $$(".gallery__item");
  const chips = $$(".chip[data-filter]");
  const status = $("#gallery-status");
  const grid = $(".gallery__grid");
  if (!items.length || !grid) return;

  // Make every image a keyboard-focusable button that opens the lightbox
  items.forEach((item) => {
    const media = $(".img-placeholder, img", item);
    if (!media) return;
    const caption = $("figcaption", item);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery__open";
    button.setAttribute("aria-label", `View larger: ${caption ? caption.textContent.trim() : "gallery image"}`);
    media.replaceWith(button);
    button.appendChild(media);
  });

  const empty = document.createElement("p");
  empty.className = "gallery__empty";
  empty.textContent = "No photos in this category yet.";
  empty.hidden = true;
  grid.after(empty);

  const visibleItems = () => items.filter((item) => !item.hidden);

  function applyFilter(category) {
    items.forEach((item) => {
      const show = category === "all" || item.dataset.category === category;
      item.hidden = !show;
      item.classList.remove("is-entering");
      if (show) { void item.offsetWidth; item.classList.add("is-entering"); }
    });
    chips.forEach((chip) => {
      const active = chip.dataset.filter === category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    const count = visibleItems().length;
    empty.hidden = count > 0;
    if (status) status.textContent = count ? `Showing ${count} ${count === 1 ? "photo" : "photos"}.` : "No photos in this category yet.";
  }

  chips.forEach((chip) => chip.addEventListener("click", () => applyFilter(chip.dataset.filter)));

  const openLightbox = initLightbox(visibleItems);
  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".gallery__open");
    if (button) openLightbox(button.closest(".gallery__item"));
  });
}

/* 5. LIGHTBOX: native <dialog> gives focus trapping, Esc to close and focus
      return for free. Arrow keys and swipe move between visible images. ------ */
function initLightbox(getItems) {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Gallery image viewer");
  dialog.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close viewer"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
    <figure class="lightbox__figure">
      <div class="lightbox__media"></div>
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <div class="lightbox__bar">
      <button type="button" class="lightbox__btn" data-dir="-1" aria-label="Previous image"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
      <p class="lightbox__count" aria-live="polite"></p>
      <button type="button" class="lightbox__btn" data-dir="1" aria-label="Next image"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
    </div>`;
  document.body.appendChild(dialog);

  const slot = $(".lightbox__media", dialog);
  const caption = $(".lightbox__caption", dialog);
  const counter = $(".lightbox__count", dialog);
  let list = [];
  let index = 0;

  function show(i) {
    index = (i + list.length) % list.length;
    const item = list[index];
    const media = $(".img-placeholder, img", item).cloneNode(true);
    if (media.tagName === "IMG") {
      media.removeAttribute("loading");
      if (media.dataset.full) media.src = media.dataset.full;   // optional larger version
    }
    slot.replaceChildren(media);
    const text = $("figcaption", item);
    caption.textContent = text ? text.textContent.trim() : "";
    counter.textContent = `${index + 1} of ${list.length}`;
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest(".lightbox__close")) dialog.close();
    const nav = event.target.closest("[data-dir]");
    if (nav) show(index + Number(nav.dataset.dir));
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });

  let touchX = null;
  dialog.addEventListener("touchstart", (event) => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  return function open(item) {
    list = getItems();
    show(Math.max(list.indexOf(item), 0));
    dialog.showModal();
  };
}

/* 6. CONTACT FORM: validation now; sending only when CONFIG.formEndpoint is set */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGES = {
  name: { required: "Enter your full name." },
  email: { required: "Enter your email address.", invalid: "Enter a valid email address, for example name@example.com." },
  phone: { required: "Enter your phone number.", invalid: "Enter a valid phone number, for example +234 800 000 0000." },
  eventType: { required: "Select the type of event." },
  date: { invalid: "Choose today's date or a later one." },
  location: { required: "Enter the event location." },
  services: { required: "Select at least one service." }
};

function setFieldError(field, message) {
  let error = document.getElementById(`${field.id}-error`);
  if (!message) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    if (error) error.remove();
    return;
  }
  if (!error) {
    error = document.createElement("div");
    error.id = `${field.id}-error`;
    error.className = "invalid-feedback";
    field.insertAdjacentElement("afterend", error);
  }
  error.textContent = message;
  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", error.id);
}

function validateField(field) {
  const key = field.dataset.field || field.name;
  const rules = MESSAGES[key];
  if (!rules) return true;
  let message = "";
  if (key === "services") {
    if (!$("input:checked", field)) message = rules.required;      // field is the <fieldset>
  } else {
    const value = field.value.trim();
    if (field.required && !value) message = rules.required;
    else if (value && key === "email" && !EMAIL_PATTERN.test(value)) message = rules.invalid;
    else if (value && key === "phone" && (!/^\+?[\d\s().-]+$/.test(value) || value.replace(/\D/g, "").length < 7)) message = rules.invalid;
    else if (value && key === "date" && field.min && value < field.min) message = rules.invalid;
  }
  setFieldError(field, message);
  return !message;
}

function initForm() {
  const form = $("#enquiry-form");
  if (!form) return;
  const status = $("#form-status");
  const submit = $('button[type="submit"]', form);
  // Text inputs, selects, textarea and the services <fieldset>, in page order
  const fields = $$("[data-field], input[name], select[name], textarea[name]", form)
    .filter((f) => MESSAGES[f.dataset.field || f.name] && f.type !== "checkbox");

  const dateField = form.elements.date;   // earliest selectable date = today (local time)
  if (dateField) dateField.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function showStatus(type, text) {
    status.className = `form-status is-${type}`;
    status.textContent = text;
  }

  fields.forEach((field) => {
    field.addEventListener("blur", () => { if (field.value && field.value.trim() || field.classList.contains("is-invalid")) validateField(field); });
    field.addEventListener("input", () => { if (field.classList.contains("is-invalid")) validateField(field); });
    field.addEventListener("change", () => { if (field.classList.contains("is-invalid")) validateField(field); });
  });

  // "Enquire about this service" links tick the matching checkbox
  $$("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      $$('input[name="services"]', form).forEach((box) => { if (box.value === link.dataset.service) box.checked = true; });
      setFieldError($("#services-group"), "");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.elements.website && form.elements.website.value) return;   // honeypot: bots only

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      showStatus("error", "Please correct the highlighted fields and try again.");
      const first = invalid[0];
      (first.matches("fieldset") ? $("input", first) : first).focus();
      return;
    }

    // No submission service connected yet: be honest, send nothing.
    if (!CONFIG.formEndpoint) {
      showStatus("error", "Your enquiry has not been sent because the online form is not connected yet. Please use the WhatsApp button or the contact details on this page.");
      return;
    }

    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = "Sending…";
    try {
      const data = new FormData(form);
      data.delete("website");
      data.delete("services");        // send the ticked services as one readable line
      data.append("services", $$('input[name="services"]:checked', form).map((box) => box.value).join(", "));
      Object.entries(CONFIG.formExtraFields).forEach(([key, value]) => data.append(key, value));
      const response = await fetch(CONFIG.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      showStatus("success", "Thank you. Your enquiry has been sent.");
    } catch (error) {
      showStatus("error", "Your enquiry could not be sent. Please try again, or contact us on WhatsApp.");
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
}

/* 7. GOOGLE MAP: shows the embed only when CONFIG.mapEmbedUrl is a real Google Maps embed URL */
function safeUrl(value, hosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (hosts && !hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) return null;
    return url;
  } catch (error) {
    return null;
  }
}

function initMap() {
  const box = $("#map-container");
  if (!box) return;
  const embed = safeUrl(CONFIG.mapEmbedUrl, ["google.com"]);
  const isEmbed = embed && (embed.pathname.startsWith("/maps/embed") ||
    (embed.pathname === "/maps" && embed.searchParams.get("output") === "embed"));
  if (isEmbed) {
    const frame = document.createElement("iframe");
    frame.src = embed.href;
    frame.title = "SHEVENT AFRICA location on Google Maps";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.allowFullscreen = true;
    box.replaceChildren(frame);
  } else if (CONFIG.mapEmbedUrl) {
    console.warn("SHEVENT AFRICA: CONFIG.mapEmbedUrl must be a Google Maps embed URL (https://www.google.com/maps/embed?... or ...maps?q=...&output=embed).");
  }
  const link = safeUrl(CONFIG.mapLinkUrl, ["google.com", "goo.gl"]);
  const linkEl = $("#map-link");
  if (link && linkEl) { linkEl.href = link.href; linkEl.hidden = false; }
}

/* 8. SOCIAL LINKS: an icon becomes a live link only when its URL is set in CONFIG.social */
const SOCIAL_NAMES = { instagram: "Instagram", facebook: "Facebook", x: "X", tiktok: "TikTok", linkedin: "LinkedIn", youtube: "YouTube" };

function initSocial() {
  $$("a[data-social]").forEach((link) => {
    const key = link.dataset.social;
    const url = safeUrl(CONFIG.social[key]);
    if (!url) return;                                   // stays a disabled placeholder
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.classList.remove("is-placeholder");
    link.removeAttribute("aria-disabled");
    link.setAttribute("aria-label", `SHEVENT AFRICA on ${SOCIAL_NAMES[key]} (opens in a new tab)`);
  });
}

/* INIT --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  initHeader();
  initNavigation();
  initWhatsApp();
  initGallery();
  initForm();
  initMap();
  initSocial();
});
