---
layout: "blog"
title: "New publication \"Reviving, reproducing, and revisiting Axelrod’s second tournament\""
type: "Paper"
lang: "en"
categories: "blog"
author: "Nikoleta Glynatsi"
link: "https://doi.org/10.1038/s44488-026-00016-w"
link_label: "Read the paper"
translation_url: "/ja/blog/new-publication-reviving-reproducing-and-revisiting-axelrods/"
issue: 24
---

Our paper, “Reviving, reproducing, and revisiting Axelrod’s second tournament”, has been published in _Communications AI & Computing_!

In the 1980s, Robert Axelrod organised two computer tournaments to investigate how cooperation can emerge between individuals who repeatedly interact. Both tournaments were won by Tit for Tat, a remarkably simple strategy that starts by cooperating and then copies its opponent’s previous action. These tournaments became foundational studies in the field of cooperation and evolutionary game theory.

However, despite their influence, Axelrod’s original results had never been systematically reproduced using the original code.

In our paper, we return to Axelrod’s second tournament, for which the original Fortran implementations of the 63 submitted strategies have survived. We revive this code by making it compatible with modern compilers and integrating it with the `Axelrod-Python` library, allowing us to rerun the tournament as faithfully as possible.

So, do Axelrod’s original conclusions still hold?

Largely, yes! Tit for Tat remains the overall winner, and the main conclusions about the importance of cooperation, retaliation, and forgiveness are reproduced. However, we also find some differences in the rankings of individual strategies, highlighting the role of stochasticity and implementation details.

We then revisit the tournament in the context of subsequent research. By introducing additional strategies and conducting almost 79 million tournaments, we investigate how the original results depend on the strategies participating and the conditions under which they interact. Our findings show that while Tit for Tat performed remarkably well in Axelrod’s original setting, other strategies can outperform it in more diverse environments.

Beyond the results themselves, this work highlights the importance of reproducibility in computational social science. By recovering and preserving historical code, we can revisit influential scientific findings, evaluate their robustness, and build on them using modern computational tools.
