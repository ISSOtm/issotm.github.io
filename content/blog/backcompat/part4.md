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

We try hard, however, to mitigate the pain, with a three-pronged approach:

- **Deprecations**: We deprecate every feature for at least one version before removing it.

  {% admonition(kind="note", title="exception") %}
  There has been one exception, the 0.6.0 [trigonometry function changes], which turned out to be a backwards-incompatible change we missed.
  Again, we're only human 😛
  {% end %}

  This has mostly succeeding in avoiding surprising breakage, with the exception of the `-h` flag (more on that in a bit); however, some have pointed out that the warnings are still annoyances like errors.
  I disagree: a warning can be temporarily ignored while progressively fixing up a codebase, but a hard error forces you to fix everything before you can even check out the results.

  As for [`rgbasm -L`, AKA `--preserve-ld`], it turned out that the deprecation mechanism we chose (warn on first trigger, introduce `-l` / `--auto-ldh` to silence it) annoyed people who were trying to support 0.6.0 and 0.5.0 at the same time: before 0.6.0, `-l` would be a hard error, but after it, its _absence_ would produce warnings.
  In hindsight, I think we should have not provided those flags, and instructed those projects to [use `-Wno-obsolete`] (or [maybe `-w`]?) while they wished to keep supporting 0.6.0.

- **Checking downstream projects**: We integrated several projects using RGBDS into our CI, and thus, attempt to monitor the impact of changes we make.
  We also submit patches to them when breakage is made, both to evaluate how involved the upgrade process is, and also to attempt to repay the technical debt we create ourselves.

  Note that, in particular, projects that are not brought to our attention (not to mention private projects!)
  Hence, I get quite 😒 when someone complains that <q>$CHANGE breaks a project of mine that I haven't released!</q>.
  Since RGBDS is a project made available publicly for free, I don't consider it fair to have to take into account what people keep to themselves.
  If we _were_ being paid somehow, then the dynamic would be different.

- **Archive of old versions**: Finally, we make sure to keep an archive of every version that has been released thus far _and its documentation_ [readily accessible](https://rgbds.gbdev.io/docs).

  So, even if we are not updating it anymore, a version that your project has worked with, will keep working all the same.
  All you need to do, is **document which version of RGBDS you are currently using**, for example in your project's README.[^guesstimate]

  Of course, then it means that you wouldn't be getting the latest features without some extra effort; please re-read [the previous part's conclusion](@/blog/backcompat/part3.md#conclusion) for a note about that.

[^required]: If you have already thought of some way the change could have been implemented backwards-compatibly, please hold on to that thought for now, I'll address that further down.

[^guesstimate]: For projects which haven't documented their version, checking the latest version available as of the first commit is usually a good (first) guess.

[trigonometry function changes]: https://github.com/gbdev/rgbds/pull/1060
[`rgbasm -L`, AKA `--preserve-ld`]: https://rgbds.gbdev.io/docs/v0.6.0/rgbasm.1#L
[use `-Wno-obsolete`]: https://rgbds.gbdev.io/docs/v0.6.0/rgbasm.1#Wno-obsolete
[maybe `-w`]: https://rgbds.gbdev.io/docs/v0.6.0/rgbasm.1#w

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

I would have liked to be able to provide some kind of upgrade tool, or at least documentation on some regexes to run on your code to fix the bulk of the errors.
Unfortunately, it was too unclear how to structure such instructions, and too difficult to design such a program... so that hasn't come to fruition yet.
I have hope that perhaps someone will pick that work up?

With all of that said, and the last section especially getting a little personal&mdash;guilty as charged, I needed a little venting&mdash;I want to leave on a more positive note, and provide guidance on how to avoid such difficult situations in the first place.

[object file format]: https://rgbds.gbdev.io/docs/rgbds.5
