+++
title = "RGBDS' stance"
authors = [ "stuff@eldred.fr (ISSOtm)" ]

[taxonomies]
tags = [ "gbdev", "back-compat" ]

[extra]
breadcrumb = "Our position"
+++

After having explored the space of options available to us, now is finally time to talk about the decisions that have been taken for RGBDS.

<!-- more -->

## Compat or changes?

It is readily apparent that RGBDS' maintainers have prioritised changes over backwards compatibility; after all, that's the entire _raison d'être_ of this article (series)!

The first question, then, is _why_.
After all, RGBDS is an old tool, with a lot of established users and a lot of projects that have been relying on it.
However, it is also a tool that is still getting used today, in 2025; and, as someone put it, <q>developing for a 90\'s console shouldn't force you to do it like in the 90\'s</q>.

The first foot put down the slippery slope was "oh, the error messages barely indicate where the error occurred".
This is, on its face, uncontroversial to fix; however, doing so required[^required] making changes to the [object file format], which annoyed some people because they had to rebuild their projects from scratch.

Every other change merely falls somewhere else on the "benefits vs. discontent" scale.

TODO:

- Deprecations
- "Crater" runs
- Old versions

[^required]: If you have already thought of some way the change could have been implemented backwards-compatibly, please hold on to that thought for now, I'll address that further down.

## "You could have done better!"

Some critics point out that the changes could have been done while causing less pain.
For example, the "error location" improvement described above could have avoided causing compatibility headaches if RGBDS was kept able to read older object files.

This is both true, and an option that was considered at the time.
But it was rejected, because the complexity would have been high, yet the benefit was guesstimated[^telemetry] to be low.

I want to emphasize something: all of the people working on RGBDS are **hobbyists**, spending their time on it yet providing the fruit of their efforts **for free**.
When they say that something is "too much effort", that is their right, and complaining about it lies somewhere between being unempathetic and being an asshole; especially because everyone and anyone is not only able to re-create RGBDS on their own in a way that they prefer ("with blackjack and hookers!"), but _all_ of the source code is _right there_, so you don't even have to do it from scratch!

And since numbers always catch people's eyes, I would like to point out that someone has ballparked the work I've put into RGBDS at 250,000€ at standard engineer rates in my country, over a period of five years.
I hope this explains why I tend to get a little jumpy and bitter when my[^our] work gets criticised by people who haven't otherwise lifted a finger to contribute[^contrib].

[^telemetry]: It's worth putting emphasis on that "guesstimated" part: we have no usage data whatsoever. This means that we can only rely on feedback from the users we happen to hang out with, which is a huge bias we are aware of. The alternative would be to add in telemetry, but the mere act of bringing up the thought has already created a shitstorm, twice; so let's not go there.

[^our]: By this, I'm referring to the work I've put in myself. RGBDS is **not** my sole work: not only do I stand on the shoulders of giants (by which I mean every maintainer and contributor that came before me) regardless of how much I have personally contributed, but I have been especially helped by the wonderful [Rangi42] since 2020!

[^contrib]: Writing code isn't the only way to contribute! Drafting up actual implementation designs (i.e. going beyond saying "it'd be nice if there was a way to do <var>X</var>", dialoguing with the implementers on _how_ <var>X</var> can be done), collecting feedback from places we aren't in, searching prior art, or even writing [peripheral tools][rgbenv] and [scripts][contrib] is a huge help!

[Rangi42]: https://github.com/Rangi42
[rgbenv]: https://github.com/gbdev/rgbenv#readme
[contrib]: https://github.com/gbdev/rgbds/tree/master/contrib

## Conclusion

With all of that said, and the last section especially getting a little personal&mdash;guilty as charged, I needed a little venting&mdash;I want to leave on a more positive note, and provide guidance on how to avoid such difficult situations in the first place.
