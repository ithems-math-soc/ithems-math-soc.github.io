/*
 * Hamburger navigation for narrow screens.
 *
 * Toggles .is-nav-open on <html>; _sass/_nav-drawer.scss does the rest.
 * The drawer closes on Escape, on a link click, on a tap on the dimmed
 * backdrop, or when the window grows past the breakpoint where the top
 * menu is visible again.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.getElementById('js-nav-toggle');
  var drawer = document.getElementById('js-nav-drawer');
  var backdrop = document.getElementById('js-nav-backdrop');
  if (!button || !drawer) { return; }

  var open = false;

  function setOpen(isOpen) {
    if (open === isOpen) { return; }
    open = isOpen;
    root.classList.toggle('is-nav-open', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    // pause the smooth-scroll engine while the drawer is open
    if (window.siteScroll) { isOpen ? window.siteScroll.stop() : window.siteScroll.start(); }
  }

  button.addEventListener('click', function () { setOpen(!open); });
  if (backdrop) { backdrop.addEventListener('click', function () { setOpen(false); }); }

  Array.prototype.forEach.call(drawer.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); }
  });

  var wide = window.matchMedia('(min-width: 900px)');
  function onResize() { if (wide.matches) { setOpen(false); } }
  if (wide.addEventListener) { wide.addEventListener('change', onResize); }
  else if (wide.addListener) { wide.addListener(onResize); }
})();
