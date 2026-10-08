/*
 * Page transitions without reloading.
 *
 * Internal links are fetched in the background and only the page content is
 * swapped: the hero (.page-lead), the main content (#page-wrapper, which also
 * holds the footer) and the drawer menu. The header is updated in place, so it
 * never flashes and a hovered link keeps its hover state. Content fades out,
 * is replaced, then fades in (see _sass/_transition.scss). Falls back to a
 * normal navigation on any error.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var LEAVE = 400; // ms, keep in sync with _transition.scss
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }

  function swap(selector, doc) {
    var from = doc.querySelector(selector);
    var to = document.querySelector(selector);
    if (from && to) { to.replaceWith(from); }
    else if (to) { to.remove(); }
    else if (from) { document.getElementById('page-wrapper').before(from); } // a hero on the new page only
  }

  // Update the header in place (links, labels, current-page marks) rather than
  // replacing it, so a hovered link keeps its hover state and nothing re-animates.
  function updateHeader(doc) {
    var cur = document.querySelectorAll('#masthead a, #masthead button');
    var next = doc.querySelectorAll('#masthead a, #masthead button');
    if (cur.length !== next.length) { swap('#masthead .inner-wrap', doc); if (window.siteNav) { window.siteNav.bind(); } return; }
    cur.forEach(function (el, i) {
      var n = next[i];
      ['href', 'class', 'aria-label'].forEach(function (attr) {
        if (n.getAttribute(attr) !== el.getAttribute(attr)) { el.setAttribute(attr, n.getAttribute(attr)); }
      });
      if (n.innerHTML !== el.innerHTML) { el.innerHTML = n.innerHTML; }
    });
  }

  function render(doc) {
    document.title = doc.title;
    root.lang = doc.documentElement.lang;
    updateHeader(doc);
    swap('#js-nav-drawer', doc);
    swap('.page-lead', doc);
    swap('#page-wrapper', doc);
    // a real navigation would reset focus; move it off the clicked link onto the new content
    document.getElementById('page-wrapper').focus({ preventScroll: true });
    if (window.siteScroll) { window.siteScroll.scrollTo(0, { immediate: true }); window.siteScroll.resize(); }
    else { window.scrollTo(0, 0); }
    if (window.siteReveal) { window.siteReveal(); }
  }

  function go(url, push) {
    if (busy) { return; }
    busy = true;
    root.classList.add('is-leaving');
    Promise.all([
      fetch(url).then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        return r.text();
      }),
      wait(LEAVE)
    ]).then(function (res) {
      var doc = new DOMParser().parseFromString(res[0], 'text/html');
      if (!doc.querySelector('#page-wrapper')) { throw new Error('unexpected page'); }
      if (push) { history.pushState(null, '', url); }
      render(doc);
      // let the new content paint at opacity 0 before fading it in
      setTimeout(function () {
        root.classList.remove('is-leaving');
        busy = false;
      }, 40);
    }).catch(function () {
      location.href = url; // plain navigation
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) { return; }
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) { return; }
    if (url.pathname === location.pathname && url.search === location.search) { return; } // same page / anchor
    if (!/\/$|\.html$/.test(url.pathname)) { return; } // files (pdf, images) load normally
    e.preventDefault();
    go(url.href, true);
  });

  window.addEventListener('popstate', function () { go(location.href, false); });
})();
