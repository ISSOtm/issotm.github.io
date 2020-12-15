---
title: Fibrs
permalink: /fibrs
layout: single
---

Fibrs, to be pronounced "fibers".
A dev log of my developing a REST API in Rust over the course of a week.

For context, a job interview required me to program a REST API serving Fibonacci computations, in the language of my choice, in a week, and writing a dev log along the way.
I figured that I could make it public, and why not make the dev log be blog posts?
Initial goal: one post per day, but we'll see as it goes!

{%- assign posts = site.categories.fibrs | sort: "date" %}
{% include excerpt-list.html collection=posts dates=true %}
