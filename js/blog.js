/*
 * Blog index: filter by type, search by keyword, sort.
 *
 * Works entirely on the post cards already rendered by _includes/blog-list.html
 * (each card carries data-type / data-date / data-title / data-search), so no
 * extra requests are needed. The current filter is mirrored into the URL
 * (?tag=Paper&q=...&sort=...) so a filtered view can be shared.
 */
(function () {
  'use strict';

  var list = document.getElementById('blog-items');
  if (!list) { return; }

  var items = Array.prototype.slice.call(list.querySelectorAll('.blog-item'));
  var tagButtons = Array.prototype.slice.call(document.querySelectorAll('.blog-tag'));
  var searchInput = document.getElementById('blog-search');
  var sortSelect = document.getElementById('blog-sort');
  var countEl = document.getElementById('blog-count-num');
  var emptyEl = document.getElementById('blog-empty');

  var state = { tag: '', q: '', sort: 'newest' };

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    var tag = params.get('tag') || '';
    var known = tagButtons.some(function (b) { return b.getAttribute('data-tag') === tag; });
    state.tag = known ? tag : '';
    state.q = params.get('q') || '';
    var sort = params.get('sort') || 'newest';
    state.sort = (sort === 'oldest' || sort === 'title') ? sort : 'newest';
  }

  function writeUrl() {
    var params = new URLSearchParams();
    if (state.tag) { params.set('tag', state.tag); }
    if (state.q) { params.set('q', state.q); }
    if (state.sort !== 'newest') { params.set('sort', state.sort); }
    var qs = params.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', url);
    }
  }

  function matches(item) {
    if (state.tag && item.getAttribute('data-type') !== state.tag) { return false; }
    if (state.q) {
      var needle = state.q.toLowerCase();
      var haystack = (item.getAttribute('data-title') || '') + ' ' + (item.getAttribute('data-search') || '');
      if (haystack.indexOf(needle) === -1) { return false; }
    }
    return true;
  }

  function compare(a, b) {
    if (state.sort === 'title') {
      var ta = a.getAttribute('data-title') || '';
      var tb = b.getAttribute('data-title') || '';
      return ta < tb ? -1 : (ta > tb ? 1 : 0);
    }
    var da = a.getAttribute('data-date') || '';
    var db = b.getAttribute('data-date') || '';
    if (da === db) { return 0; }
    if (state.sort === 'oldest') { return da < db ? -1 : 1; }
    return da > db ? -1 : 1;
  }

  function render() {
    var visible = 0;
    var sorted = items.slice().sort(compare);
    sorted.forEach(function (item) {
      var show = matches(item);
      if (show) { visible += 1; }
      item.classList.toggle('is-hidden', !show);
      list.appendChild(item);
    });

    if (countEl) { countEl.textContent = String(visible); }
    if (emptyEl) { emptyEl.classList.toggle('is-hidden', visible !== 0); }

    tagButtons.forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tag') === state.tag);
    });
    if (searchInput && searchInput.value !== state.q) { searchInput.value = state.q; }
    if (sortSelect && sortSelect.value !== state.sort) { sortSelect.value = state.sort; }

    writeUrl();
  }

  tagButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      state.tag = b.getAttribute('data-tag') || '';
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.q = searchInput.value.trim();
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
    });
  }

  readUrl();
  render();
})();
