/*
 * Scroll reveal: fade content in as it enters the viewport.
 *
 * Elements matching the selectors below get a data-reveal attribute; when one
 * scrolls into view it receives .is-visible and _sass/_reveal.scss animates it.
 * Items inside a list (people cards, publications) are staggered slightly.
 * Exposed as window.siteReveal so js/transition.js can run it again after
 * swapping in a new page. Does nothing when the browser lacks
 * IntersectionObserver or the visitor prefers reduced motion.
 */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) { return; }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

  var single = [
    '.page-lead-content',
    '.page-content > h5',
    '.page-content > p',
    '.page-content > ul',
    '.page-content > ol',
    '.page-content > .page-title',
    '.publication-year > h6',
    '.blog-latest > h5',
    '.blog-latest-more',
    '.blog-list > h5',
    '.blog-toolbar'
  ];
  var staggered = [
    '.people-tiles > .tile',
    '.publication-items > .publication-item',
    '.blog-items > .blog-item'
  ];

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) { return; }
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0 });

  function reveal() {
    var targets = [];
    single.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { targets.push(el); });
    });
    staggered.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el, i) {
        // restart the stagger for each list so long lists do not wait seconds
        el.style.setProperty('--reveal-delay', ((i % 6) * 0.08) + 's');
        targets.push(el);
      });
    });
    targets.forEach(function (el) {
      if (el.hasAttribute('data-reveal')) { return; }
      el.setAttribute('data-reveal', '');
      observer.observe(el);
    });
  }

  reveal();
  window.siteReveal = reveal;
})();
