/*
 * Smooth (inertial) scrolling with Lenis (js/vendor/lenis.min.js).
 *
 * The page follows the wheel with a slight lag and eases to a stop, which
 * gives scrolling a calmer, heavier feel. Disabled for visitors who prefer
 * reduced motion. js/nav.js pauses it while the drawer is open through
 * window.siteScroll.
 */
(function () {
  'use strict';

  var Lenis = window.Lenis;
  if (!Lenis) { return; }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

  var lenis = new Lenis({
    smoothWheel: true,
    lerp: 0.11,          // lower = heavier (the reference site uses the default 0.1)
    wheelMultiplier: 1,
    touchMultiplier: 1
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  window.siteScroll = lenis;
})();
