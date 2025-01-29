+++
title = "Having our 🍰 and 🍽️ eating it too"
authors = [ "stuff@eldred.fr (ISSOtm)" ]

[taxonomies]
tags = [ "gbdev", "back-compat" ]

[extra]
breadcrumb = "Compromising"
+++

We have established that never changing anything leads to buildup of frustration, and that "moving fast and breaking things" is no better.
Let's seek a more reasonable middle ground.

<!-- more -->

## Giving ourselves options

And I mean this literally: giving the user the option to pick the behaviour they want.

The appeal is obvious: if you need compatibility, you can get the old behaviour; if you want improved UX, you can get the new behaviour.
But there are a _lot_ of wrinkles to that.

First off, a simple question.
_What should the default behaviour be?_
Existing users want the old behaviour by default, so that the new version can be dropped in and their code keeps working; new users will want the new behaviour by default, otherwise having to opt into it is, itself, a [papercut].
This leave us exactly at our starting point, with the same tension; the only thing that has been gained is that the tension is _reduced_.
Although, it can also be infuriating to realise that you encountered an obscure error merely because you missed [a single paragraph in the manual][ick-b]... <small>(yes, this example is exaggerated, since it's part of [a pastiche of programming languages][INTERCAL])</small>

The next problem is reasoning about behaviour.
Because this choice necessarily implies that the behaviour of a particular piece also depends on the compatibility configuration.
In particular, this hinders code reuse, since code copy-pasted from any help forum may not work as intended on _your_ setup if it's newer—or worse, it's older!

Another problem is whether it's possible to mix old and new behaviours in a single system; for example, you may have started your own work using more recent features, and eventually want to use a library which turns out to be incompatible with them.

And, lastly, this becomes a combinatorial explosion of old and new code paths, which increases the burden placed onto the maintainers and testers!

{% admonition(kind="tip", title="Prior art") %}

- [CMake] has "policies", which govern individual behaviours, and tend to be hard to keep in mind--they solve the "default behaviour" aspect, but not the behaviour one, and can in fact make it worse.
- [Rust] handles this using its "[editions]", which essentially allow selecting which set of backwards-incompatible changes is desired.
  They are scoped at the "crate" (library, roughly) level, which are also guaranteed to continue interoperating across editions (=&nbsp;in a mixed-compat context).
  (Although, one would also be right to point out that _some_ breaking changes are made outside of editions...)

{% end %}

## "This store is closing down soon"

Another way to soften the blow is to warn users in advance that the breakage is going to occur.
This can be difficult to implement, depending on the kind of workflow you are normally providing: in more interactive contexts, in particular, it can be difficult to find a way to warn the user without breaking their flow and feeling like an annoyance.
It can be even more difficult to describe what the new way is, too.

The effectiveness and usefulness of such a warning can be improved by providing guidance on how to switch from the old way to the new one (within reason, of course).
Bonus points if some kind of automated tool exists that can perform the transformation automatically&mdash;users will be happy if they don't have to do some kind of mechanical task by hand, particularly if they have a lot of code under their care!

Regardless, this solution has two flaws.

- First, if deprecations are too common, then users will tend to tune them out, and possibly outright disable deprecation warnings (and then complain when the breakage finally occurs).
- Further, how long should the deprecation period last?
  One month? Six months? A year? Five?
  Or maybe one release? Two? Until the next major version, maybe?

{% admonition(kind="tip", title="Prior art (cont.)") %}

- CMake's policies also serve as deprecation warnings, since relying on the `OLD` behaviour prints a warning[^Wno-dev].
- Rust also sometimes breaks backwards compatibility outside of editions, generally to fix bugs in the compiler.
  They do provide generous advance periods ("this will be rejected by a future version of the compiler"), and, interestingly, still mention the deprecation after enforcing it ("this was accepted by a previous version of the compiler")!

{% end %}

[^Wno-dev]: Unless `-Wno-dev` is specified! That's a useful flag for people who are just compiling CMake projects and find its output too verbose 😉

## Semantic Versioning

Well, speaking of version numbers, let's talk about how to convey breakage to users, especially in a more gentle, more ahead-of-time manner.

The question "what goes into a version number?" is as old as software itself, and some folks have decided to formalise a methodology (one of many!) and call it [SemVer] (for "Semantic Versioning").
The gist of SemVer is to split the version into three numbers, and the first one is changed when a backwards-incompatible change is made.
Thus, going from version `2.3.6` to `2.3.11` or `2.5.1` should be safe, but you can expect something to seize if going to version `3.1.0`.

This is useful!
Just looking at two version numbers, you can tell at a glance whether it's safe to upgrade without giving second thought or attention.
In fact, this can even be done by tools, such as Rust's [Cargo] (see, for example, [`cargo update --breaking`]).
But it's not a silver bullet either, because it turns out that what counts as breakage is [not simple], sometimes [astonishing even] (scroll down a bit), and [scarily often subjective]..!

That said, SemVer adds an interesting provision that, essentially, "under `0.x` anything goes".
It was intended to allow "pre-production" testing not just in isolation, but it's often abused because [incrementing the major version number is scary].
This is however achieving little to nothing, since users tend to generally disregard the first number, since it's just a meaningless constant&mdash;I know at least one person who calls RGBDS 0.8.0 "RGBDS 8".
Please consider [the wisdom from SemVer]:

> If you have a stable API on which users have come to depend, you should be 1.0.0.
> If you’re worrying a lot about backward compatibility, you should probably already be 1.0.0.

Unfortunately, this wisdom is ignored [annoyingly often][0ver].

## Version branches 🌳

Another way to ease the pain for users, is to keep maintaining a previous version after making an incompatible change.
This can be considered a compile-time version of the "program options" above: instead of the user making their choice at runtime, they select their options by selecting which version of the probgram they run.

Thus, after releasing 3.0.0, 2.6.2 will still be released; often, incorporating the changes from 3.0.1 or 3.1.0 (a process called "backporting"), perhaps only some of them.

Though, in that last part lies the major downside of version branches: the codebases necessarily diverge.
This means two things.
First, that they need to be developed, tested, etc. separately&mdash;which, like with the "runtime options" above, generates extra effort on your maintainers.
Second, that it may also require adapting the patches during the backporting process.
This can introduce bugs (and thus reinforce the first point), and sometimes be difficult enough not to bother.

## Conclusion

One last note: it is, further, possible to mix and match these techniques: for example, having a few runtime options, deprecating them, and removing them in a later version branch.
See what works for your project!

Anyway; a common thread, perhaps _the_ common thread, between each of these techniques, is that they involve far more work from the maintainer(s), if only to avoid quality slipping.
Some projects, especially the smaller ones, may simply **not have the resources** that would need to be spent on such an endeavour.

_The following paragraph is somewhat personal; please excuse my indulging in a little bit of venting._
Small projects do not have many resources; especially when something is run by a few volunteers, they will usually prioritise what they _enjoy_ working on.
This is by design, since they have no binding obligations to any of their users&mdash;they are, after all, providing the fruit of their labour for free.
Thus, harshly criticising them for their decisions, or otherwise throwing them under the bus, is _not_ helpful.
If anything, it's the opposite, because you'll be either discouraging them, or alienating them (and thus they'll grow to ignore any pertinent or constructive part of what you might be saying).

[papercut]: @/blog/backcompat/part1.md#it-sounded-better-in-my-head
[ick-b]: http://www.catb.org/~esr/intercal/ick.htm#Language_002daffecting-Options
[INTERCAL]: http://www.catb.org/~esr/intercal/
[CMake]: https://cmake.org/cmake/help/v3.31/manual/cmake-policies.7.html#id2
[Rust]: https://rust-lang.org
[editions]: https://doc.rust-lang.org/nightly/edition-guide/
[SemVer]: https://semver.org/
[Cargo]: https://doc.rust-lang.org/stable/cargo/reference/resolver.html
[`cargo update --breaking`]: https://doc.rust-lang.org/stable/cargo/commands/cargo-update.html#option-cargo-update---breaking
[not simple]: https://doc.rust-lang.org/stable/cargo/reference/semver.html
[astonishing even]: https://doc.rust-lang.org/stable/cargo/reference/semver.html?highlight=inference#fn-generalize-compatible
[scarily often subjective]: https://doc.rust-lang.org/stable/cargo/reference/semver.html?highlight=usually#trait-new-default-item
[incrementing the major version number is scary]: https://semver.org/#if-even-the-tiniest-backward-incompatible-changes-to-the-public-api-require-a-major-version-bump-wont-i-end-up-at-version-4200-very-rapidly
[the wisdom from SemVer]: https://semver.org/#how-do-i-know-when-to-release-100
[0ver]: https://0ver.org/
