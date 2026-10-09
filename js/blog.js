/*
 * Blog index: filter by type (several types may be selected; a post matches if
 * it has any of them), search by keyword, sort by date.
 *
 * Works entirely on the post cards already rendered by _includes/blog-list.html
 * (each card carries data-type / data-date / data-title / data-search), so no
 * extra requests are needed. The current filter is mirrored into the URL
 * (?tag=Paper,Talk&q=...&sort=...) so a filtered view can be shared.
 * Exposed as window.siteBlog so js/transition.js can run it again after
 * swapping in the Blog page; it does nothing on pages without the list.
 */
(function () {
  'use strict';

  function init() {
    var list = document.getElementById('blog-items');
    if (!list || list.dataset.ready) { return; }
    list.dataset.ready = 'true';

    var items = Array.prototype.slice.call(list.querySelectorAll('.blog-item'));
    var tagButtons = Array.prototype.slice.call(document.querySelectorAll('.blog-tag'));
    var searchInput = document.getElementById('blog-search');
    var sortSelect = document.getElementById('blog-sort');
    var countEl = document.getElementById('blog-count-num');
    var emptyEl = document.getElementById('blog-empty');

    var state = { tags: [], q: '', sort: 'newest' };
    var known = tagButtons.map(function (b) { return b.getAttribute('data-tag'); }).filter(Boolean);

    function readUrl() {
      var params = new URLSearchParams(window.location.search);
      state.tags = (params.get('tag') || '').split(',').filter(function (t) { return known.indexOf(t) !== -1; });
      state.q = params.get('q') || '';
      state.sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
    }

    function writeUrl() {
      var params = new URLSearchParams();
      if (state.tags.length) { params.set('tag', state.tags.join(',')); }
      if (state.q) { params.set('q', state.q); }
      if (state.sort !== 'newest') { params.set('sort', state.sort); }
      var qs = params.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    }

    function matches(item) {
      if (state.tags.length && state.tags.indexOf(item.getAttribute('data-type')) === -1) { return false; }
      if (state.q) {
        var needle = state.q.toLowerCase();
        var haystack = (item.getAttribute('data-title') || '') + ' ' + (item.getAttribute('data-search') || '');
        if (haystack.indexOf(needle) === -1) { return false; }
      }
      return true;
    }

    function compare(a, b) {
      var da = a.getAttribute('data-date') || '';
      var db = b.getAttribute('data-date') || '';
      if (da === db) { return 0; }
      if (state.sort === 'oldest') { return da < db ? -1 : 1; }
      return da > db ? -1 : 1;
    }

    function render() {
      var visible = 0;
      items.slice().sort(compare).forEach(function (item) {
        var show = matches(item);
        if (show) { visible += 1; }
        item.classList.toggle('is-hidden', !show);
        list.appendChild(item);
      });
      if (countEl) { countEl.textContent = String(visible); }
      if (emptyEl) { emptyEl.classList.toggle('is-hidden', visible !== 0); }
      tagButtons.forEach(function (b) {
        var tag = b.getAttribute('data-tag');
        b.classList.toggle('is-active', tag ? state.tags.indexOf(tag) !== -1 : state.tags.length === 0);
      });
      if (searchInput && searchInput.value !== state.q) { searchInput.value = state.q; }
      if (sortSelect && sortSelect.value !== state.sort) { sortSelect.value = state.sort; }
      writeUrl();
    }

    // "All" clears the selection; any other tag toggles in or out of it
    tagButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        var tag = b.getAttribute('data-tag');
        if (!tag) { state.tags = []; }
        else if (state.tags.indexOf(tag) === -1) { state.tags.push(tag); }
        else { state.tags.splice(state.tags.indexOf(tag), 1); }
        render();
      });
    });
    if (searchInput) {
      searchInput.addEventListener('input', function () { state.q = searchInput.value.trim(); render(); });
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; render(); });
    }

    readUrl();
    render();
  }

  init();
  window.siteBlog = init;
})();
