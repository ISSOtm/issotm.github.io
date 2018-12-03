---
layout: single
title: Game Boy ASM tutorial
permalink: /projects/gb-asm-tutorial
---

This is a tutorial aiming at teaching Game Boy programming in assembly, even to beginners.

You can check it out [here](/gb-asm-tutorial), or peek at the source [there](https://github.com/ISSOtm/gb-asm-tutorial).


## Motivation

There's a cruel lack of Game Boy programming tutorials out there. The best I could find is [Duo's ASMSchool](http://gameboy.mongenel.com/asmschool.html), which is far from complete, and whose presentation might throw some people off.

Some would argue that there are plenty programming tutorials for GBDK, to which I answer that GBDK is a very bad toolchain, and that [C fits the Game Boy pretty badly](https://gist.github.com/ISSOtm/4f4d335c3fd258ad0dfc7d4d615409fd.js). Even if you disagree, we have to agree that GBDK cannot replace ASM, so there is a strong need for ASM tutorials.

Further, the [toolchain](https://github.com/rednex/rgbds) has evolved quite a bit, and it would be great to document their usage.


## Status

Sadly, frozen for now. I am busy with other projects (including my studies), but this is a very important thing that I want to get done.


## Plans

The currently WIP part will end with the construction of an Arkanoid clone. The following and last part will be about advanced Game Boy trickery (such as raster FX), and the final lesson(s?) will converge towards building a space SHMUP, from scratch.



## Dev notes

This project has also been an experiment regarding web dev, albeit a light one. I was using Bootstrap and static HTML (with a copy-pasted boilerplate, and updating all pages consistently was a nightmare); so I decided instead to write code that did automatic templating.

I also found that the site I made looked very basic, yet gulped down a few megs to load what amounted to text and coloring rules. For a tutorial featuring a heavy accent on optimization, this would've been quite the irony. So, my second goal was to make the tutorial ultra lightweight, and therefore bloat-less.

And, finally, I heard complaints from people scared of JavaScript, so I challenged myself to make the tutorial JS-free.

In the end, the source is as basic as it gets, and the result loads instantly on any browser. I'm pretty happy with how clean the source ended up being, and I've been complimented about the resulting website. I've done research towards optimizing the site some more, and added support for navigation (so the borwser can pre-load the next page while you're reading), open graph / preview metadata, and generally was a refresher on modern HTML.
