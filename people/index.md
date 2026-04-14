---
layout: archive
title:
modified:
tags: []
image:
  feature:
  teaser:
---

<h5>Current</h5>

<div class="tiles">
{% for post in site.categories.current reversed%}
  {% include people-grid.html %}
{% endfor %}
</div><!-- /.tiles -->

<!-- <div id="alumni">
<h5>Alumni</h5>
</div> -->