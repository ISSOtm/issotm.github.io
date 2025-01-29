+++
title = "Why RGBDS has been breaking backwards compatibility"
authors = [ "stuff@eldred.fr (ISSOtm)" ]
date = 2024-12-20

[taxonomies]
tags = [ "gbdev", "back-compat" ]

[extra]
breadcrumb = "RGBDS back-compat"
section = "blog/backcompat"
+++

<p style="--pico-color:var(--pico-muted-color);">Clickbait title: <em>I Broke Your Code And I'm Not Sorry</em>.</p>

We all hate when something we use, or rely on, breaks.
We hate it even more when it's someone else's fault.
I'm no different!

But then, why have I, as the lead maintainer of [RGBDS], been inflicting this pain upon other people for the past four years or so?

<!-- more -->

I am writing this post in the context of RGBDS, and more widely, [Game Boy development][GBDev]; however, the points made should be relevant to a wider audience: anyone designing tools or systems meant to be used by other humans or machines.
No programming knowledge should hopefully be required to understand any of these.
(Feel free to ask any clarification questions in the comments!)

## Executive summary

- Backwards incompatibility sucks.
- UX deficiencies also suck.
- Full backwards compat always has a cost.
- We have decided to prioritise UX improvements over back-compat.
- Nevertheless, we endeavour to reduce the pain as much as we can...
- ...but ultimately, we are short-staffed and not paid _at all_.
- Hope's not lost! There exist mitigations and workarounds you can apply to reduce the pain for yourself and/or other people!

[RGBDS]: https://github.com/gbdev/rgbds
[GBDev]: http://gbdev.io

---

This post has been split into several sections, to allow reading it piece by piece.
