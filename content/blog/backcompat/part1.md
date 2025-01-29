+++
title = "Context"
authors = [ "stuff@eldred.fr (ISSOtm)" ]

[taxonomies]
tags = [ "gbdev", "back-compat" ]

[extra]
breadcrumb = "Context"
+++

The big deal with RGBDS and its backwards compatibility is likely obvious to any seasoned member of [GBDev], but maybe you, dear reader, are not one.

Let's talk about what backwards compatibility is (in a rather general sense), and why it matters.

<!-- more -->

## What is RGBDS?

The short answer can be found [on its history page](https://rgbds.gbdev.io/docs/rgbds.7#HISTORY).
But, essentially, it's a collection of four tools that enables people to program their own games for the Game Boy, and which was initially released roughly at the same time as the Game Boy Color itself.

RGBDS was originally developed as a mostly single-person endeavour, but passed through several maintainers and contributors, as well as multiple platforms.
And, recently, RGBDS has seen releases more frequent than ever, bigger than ever... and also some compatibility breakage every six months on average.

<hgroup>

## Why is this a problem?

Or: "why is backwards compatibility desirable".

</hgroup>

<figure>

[![XKCD #2224](https://imgs.xkcd.com/comics/software_updates.png "Everything is a cloud application; the ping times just vary a lot.")](https://xkcd.com/2224)

<figcaption>An article about programming, written by a nerd, wouldn't be complete without some XKCDs~</figcaption>
</figure>

Due to the popularity of RGBDS within the niche of "Game Boy assembly programming", over the years, quite a lot of code relying on it has accrued.
Most of that code is either maintained by someone who uses their local copy of RGBDS, or is abandoned.
It has turned out that backwards compatibility breakages affect both of these categories.

See, the maintainers of active codebases have complained that when they want to upgrade (to benefit from a new feature or from a bugfix), they have to also adapt to the breaking changes from the new version.

And, meanwhile, people interested in checking out some of the older codebases have been faced with the problem that the latest version of RGBDS just spewed a bunch of errors... and they had no idea which version would be the right one&mdash;for those who realised that using an earlier version would work, in the first place!

So, given these clear incentives for RGBDS _not_ to break backwards compat, why has it been repeatedly broken for several years in a row?

<hgroup>

## The case against back-compat

Or: "how much do you _actually_ want back-compat?"

</hgroup>

{% admonition(kind="note") %}

Readers may disagree with me on the relative importance of each item, and their weight relative to the previous section's.
**This is expected**, as these are subjective and/or dependent on the project they apply to.

{% end %}

RGBDS was made by humans.
Humans are imperfect.

RGBDS was started back in 1997 as a single programmer's hobby project, and with seemingly only moderate knowledge of programming language theory.
Add to that that RGBDS changed hands several times through the years, still between hobby programmers, and it becomes fair to assume that some features were implemented without a lot of forethought.

Setting aside what works well, we are left with two categories:

- what just doesn't work,
- and what works but not well.

### Bugs bugs bugs 🐛

At first blush, fixing bugs seems uncontroversial.
<q>Oh no, Bad Behaviour! Who would want that? Let's fix it!</q>

<figure>

[![XKCD #1172](https://imgs.xkcd.com/comics/workflow.png "There are probably children out there holding down spacebar to stay warm in the winter! YOUR UPDATE MURDERS CHILDREN.")](https://xkcd.com/1172)

<figcaption>And yet.</figcaption>
</figure>

I like to point to one RGBDS bug report as a very good example of the XKCD above: [issue #362], "Labels can be defined with colons in their name".
Here is some code that triggered the bug[^old_syntax]:

```asm
MACRO mklabel  ; Defines a macro, that, when called...
Label_\1:      ; ...defines a label, "copy-pasting" the macro's first argument into its name.
ENDM

  mklabel x    ; Defines Label_x, perfectly legitimate.
  mklabel a:b  ; Defines Label_a:b, which shouldn't be possible!
```

Colons are _not_ valid characters for symbol names in RGBASM (labels being one kind of symbol), so this is definitely a bug.
[Worse still](https://github.com/gbdev/rgbds/issues/362#issuecomment-506028115):

> Any character that can be used in a macro arg can be used in a symbol name using this trick.
> For example, you can even put spaces in a symbol name.

Spaces in symbol names is a _huge_ problem, because it breaks the [sym file] format[^sym] that RGBLINK ends up emitting.
So, naturally, [the bug got fixed](https://github.com/gbdev/rgbds/pull/364).

In and of itself, fixing the bug broke compatibility.
But, since the behaviour wasn't matching the documentation, correcting the behaviour appeared much more sensible to us maintainers than altering the documentation!
Imagine reading a new tool's documentation, and stumbling upon:

> Symbol names can only contain the aforementioned characters, _except_ if they are generated through a macro argument precisely at the end of a label, in which case no guarantees are made \[...\]

Fixing this bug fixed the code shown above, and as usual after a bugfix, everyone was happier.
...that is, until [the following release][v0.3.9], when someone else reported that their previously-accepted code [was now rejected](https://github.com/gbdev/rgbds/issues/435#issue-502960245).
They were using code highly similar to the above, but with `$` as the "bad character" instead of `:` due to using another feature of RGBASM's.
Why didn't _they_ notice?
Well, it turns out that on other platforms (such as x86, which that user was used to), `$` is not only [permitted in labels][nasm-labels], but common![^dollar_ident]

The user could update their code to no longer rely on the bug, but this would have required significantly increasing its complexity, so they refused.
Instead, we agreed upon [a compromise](https://github.com/gbdev/rgbds/issues/270), which would give them a way to stop relying on the bug with only minimal changes.

This was not an isolated case, either:

- When `ds -N` was removed, heated discussion took place in [issue #190] ("Disallowing negative constants in `ds` breaks backwards compatibility"), before being solved by a new feature in [PR #193] ("Add support for unions");
- Likewise, [issue #136] ("Section ordering change was not backwards compatible"), was solved by a new feature designed in [issue #137].

All of these perfectly illustrate [Hyrum's Law]:

> With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody.

Unfortunately, "all observable behaviours" **includes bugs**.
Yet, in the interest of having reliable software that performs as documented, I prefer fixing at least _some_ of these bugs.

[^old_syntax]: Actually, `MACRO mklabel` was invalid [at the time][v0.5.0], and [you had to use](https://rgbds.gbdev.io/docs/v0.3.8/rgbasm.5#MACRO~2) `mklabel: MACRO`. This blog's code highlighter only knows the former syntax, though, so I cheated to keep it aesthetically pleasant.

[^sym]: Actually, this specification didn't exist yet at the time of this bug report. But the format was almost exactly the same.

[^dollar_ident]: Amusingly, RGBDS v0.9.0 made `$` valid in identifiers for that reason; so, five years later, we have come full circle 😆

### It Sounded Better In My Head

After "things that don't work", let's discuss "things that work but not well".
These are often called "_papercuts_", because they're not "lethal" to one's experience... but still at least an annoyance.

A well-known example of a "papercut" is C++'s "[Most Vexing Parse]":

<figure>

```cxx
struct Horse {
	std::string name;
	unsigned int age = 0;
};

int main() {
	Horse cadey("Cadey", 26);
	puts(cadey.name.c_str());

	Horse baby("???"); // Default value used for `age`, here 0.
	puts(baby.name.c_str());

	Horse anonymous(); // Default value used for `name` (empty string) and `age`... right?
	puts(anonymous.name.c_str());
}
```

<pre><samp>main.cpp: In function 'int main()':
main.cpp:17:24: error: request for member 'name' in 'anonymous', which is of non-class type 'Horse()'
   17 |         puts(anonymous.name.c_str());
      |                        ^~~~
</samp></pre>

<figcaption>

([Try this example yourself](https://coliru.stacked-crooked.com/a/28aea6316b300b7f)!)

</figcaption></figure>

The "papercut" here is that the "obvious" syntax _does not do what you expect_.
(The correct thing to do here is `Horse anonymous;`.)
This is also known as a violation of the [Principle of least astonishment] (or "POLA" for short).

Why are special cases bad?
Since we need to remember the tool's rules, what's just one more?

The first problem is that special cases increase "friction": they make \<the thing\> significantly harder to learn, because there's just more to learn; they _also_ make it harder to use, since you also have to keep in mind the general rule has an exception (and, sometimes, means that you must handle the exception specially).
They also increase the chance of mistakes (including bugs), because humans are _way_ better at sticking to rules than remembering exceptions.

(Also, this argument often comes from veterans who have gotten used to the papercuts, which makes it sound closer to ["Skill issue"] than I'd like.)

Let's give an example in RGBASM, with what's perhaps its most common papercut:

<figure>

```asm
MACRO fancy_println
  println "✨ ", \#, " ✨"
ENDM

  println "one"
println "two"
  fancy_println "three"
fancy_println "four"
```

<pre><samp>one
two
✨ three ✨
error: main.asm(8):
    syntax error, unexpected string, expecting : or ::
    To invoke `fancy_println` as a macro it must be indented
error: Assembly aborted (1 error)!
</samp></pre>

<figcaption>

([Try this yourself](https://gbdev.io/rgbds-live/#LYQwlgdgdCDOwAACyBBAwgJQPIAIBmIEAxgJ4D6ADgE6QAuANhAFA47V2M4BEgFOTcA0OADoBiQVxw8uTAKIA5ACJImLNjQgMI3APYQAptPYbOXWgHdt01gWLkjm7rQAWVPQaY3SldQ655tAK5UXAhAA)!)

</figcaption></figure>

To be clear, the papercut here is that the built-in `println` directive can be indented and not indented, and that doesn't make a difference; but the similar-looking `fancy_println` macro _cannot_.
More broadly, you have two animals that quack like a duck, fly like a duck, swim like a duck... but one of them tastes like red pepper.

Let's do a brief aside on that ``To invoke `fancy_println` as a macro it must be indented`` line.
I have witnessed several users reacting to it with a frustrated "if it knows what I mean to do, why doesn't it just do it!?", and I understand.
The problem is that in _this_ case, RGBASM can infer what was intended; but in some cases, it can't, and thus the rule has to exist.
An analogy may help: if you were to mis-type `simklar`, your reader may be able to guess that you meant `similar`; but if you typed `dkg`, did you mean `dig` or `dog`? Or maybe `dug`?

## Summary

The key takeaway regarding backwards compatibility is that there is a fundamental tension between **keeping** what's currently working, well, _working_; and **changing** what's making life difficult.
Both aim to improve the user experience, but sometimes, the same change can improve some users' experience _and_ harm others'!

So, then, the natural next step is to ponder how handle changes.
The next part in this series compares various strategies, and weighs their pros and cons.

[GBDev]: https://gbdev.io
[dmgpage]: https://dmgpage.com/homebrew-releases/
[issue #362]: https://github.com/gbdev/rgbds/issues/362
[sym file]: https://rgbds.gbdev.io/sym
[v0.3.9]: https://github.com/gbdev/rgbds/releases/v0.3.9
[nasm-labels]: https://www.nasm.us/xdoc/2.16.03/html/nasmdoc3.html
[Hyrum's Law]: https://en.wikipedia.org/wiki/Hyrum's_Law
[issue #190]: https://github.com/gbdev/rgbds/issues/190
[PR #193]: https://github.com/gbdev/rgbds/pull/193
[issue #136]: https://github.com/gbdev/rgbds/issues/136
[issue #137]: https://github.com/gbdev/rgbds/issues/137
[v0.5.0]: https://github.com/gbdev/rgbds/releases/v0.5.0
[Most Vexing Parse]: http://en.wikipedia.org/wiki/Most_vexing_parse
[Principle of least astonishment]: http://en.wikipedia.org/wiki/Principle_of_least_astonishment
["Skill issue"]: https://knowyourmeme.com/memes/skill-issue-simply-a-difference-in-skill
