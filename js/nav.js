/*
 * Hamburger navigation for narrow screens.
 *
 * Toggles .is-nav-open on <html>; _sass/_nav-drawer.scss does the rest.
 * The drawer closes on Escape, on a link click, on a tap on the dimmed
 * backdrop, or when the window grows past the breakpoint where the top
 * menu is visible again. js/transition.js replaces the header's inner part
 * and the drawer when the language changes, so lookups go through bind().
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var open = false;
  var button;

  function setOpen(isOpen) {
    var drawer = document.getElementById('js-nav-drawer');
    if (open === isOpen || !button || !drawer) { return; }
    open = isOpen;
    root.classList.toggle('is-nav-open', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    // pause the smooth-scroll engine while the drawer is open
    if (window.siteScroll) { isOpen ? window.siteScroll.stop() : window.siteScroll.start(); }
  }

  function bind() {
    button = document.getElementById('js-nav-toggle');
    if (button) { button.addEventListener('click', function () { setOpen(!open); }); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest && (t.closest('#js-nav-backdrop') || t.closest('#js-nav-drawer a'))) { setOpen(false); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); }
  });

  var wide = window.matchMedia('(min-width: 900px)'); // $nav-breakpoint in _sass/_variables.scss
  function onResize() { if (wide.matches) { setOpen(false); } }
  if (wide.addEventListener) { wide.addEventListener('change', onResize); }
  else if (wide.addListener) { wide.addListener(onResize); }

  bind();
  window.siteNav = { bind: bind };
})();
