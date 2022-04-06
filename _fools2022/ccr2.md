---
title: Cracker Cavern Reborn 2
permalink: /fools2022/ccr2/
layout: single
---

> *Hacking Ⅱ: Going places*

Fine. Client-side hacking is easy, but that was obviously just warming up.
Next, it's time to get your hands a little dirty: we must load the map with ID 0x1337.
The server now won't let us load further floors until we do.

Out of all the ways to go about this, I initially went with the most complicated one: since I know the map *has* to be loaded at some point, put a write breakpoint on the map data, and trace back to the save file code.

I'll be short: this didn't really turn up anything.
I was hoping that it might give a head start into disassembling the save file and that might prove useful for later challenges, but progress was kind of slow.

No, instead, [Kirby703](https://twitter.com/Kirby703_) noted that the map IDs were unchanged[^unchanged] from the 2018 edition.

[^unchanged]: Well, *most* map IDs are unchanged. At least Central Square's *was* changed, but you can also notice that the map is very different. pfero [found an unused map](https://cdn.discordapp.com/attachments/959199845191659540/960527271238717491/output.mp4) which looks a lot more like the original.

Armed with this knowledge [and the wiki](https://thezzazzglitch.fandom.com/wiki/Category:Glitchland_Locations), it's actually possible to use a cheat search to find the "current map ID" variable's address:

<figure>
<img alt="Screenshot of a new cheat search" src="{% link _fools2022/new_search.png %}" />
<figcaption>Easy come,</figcaption>
</figure>

<figure>
<img alt="Screenshot of the correct address" src="{% link _fools2022/found.png %}" />
<figcaption>easy go!</figcaption>
</figure>

...then, we can set a write breakpoint on it when changing maps...

<figure>
<img alt="Screenshot of watchpoint being set" src="{% link _fools2022/watchpoint.png %}" />
<figcaption>Note that I use the <code>short</code> type here because the value is 16-bit, and <code>short</code> is a 16-bit type (on this CPU) that GDB is aware of. Normally I'd use <code>u16</code>, but that's unavailable because I couldn't load debug info.</figcaption>
</figure>

...and override the map being transitioned to to `0x1337`:

<figure>
<img alt="Screenshot of the value being overridden" src="{% link _fools2022/override.png %}" />
<figcaption><code>p</code> is a shorthand for the "print" command. Similarly, <code>c</code> is short for "continue".</figcaption>
</figure>

Success![^mysterious_cave]
Resetting the game showed that the rock barrier was now open, granting access to the third floor.

[^mysterious_cave]: As it turns out, the "Mysterious" map has terrain at the location you'd spawn at if you went through the bottom-right ladder in CCR2. Ah. Oh well, the check still passes.

## pfero's setup

I should mention at this point that pfero was working on a custom client.

TODO: MITM setup.

Anyway, this is entirely irrelevant to what will happen [in the third challenge]({% link _fools2022/ccr3.md %}).
Totally.
