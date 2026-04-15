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

<div class="tiles people-tiles">
{% assign current_people = site.categories.current | sort: "date" | sort: "role_order" %}
{% for post in current_people %}
  {% include people-grid.html %}
{% endfor %}
</div><!-- /.tiles -->

<!-- <div id="alumni">
<h5>Alumni</h5>
</div> -->
