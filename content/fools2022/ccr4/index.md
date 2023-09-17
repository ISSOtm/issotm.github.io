+++
title = "Cracker Cavern Reborn 4"
weight = 4
+++

> *Hacking Ⅳ: Loss of integrity*

<!-- more -->

<style>
	main img { background-color: #ffffff80; }
</style>

Here's an excerpt from a chat during [the 2019 edition](@/fools2019/pk3/index.md):

> &lt;Parzival&gt; according to the achievements PK3 is encryption (again) and 4 is to hack the server (again)  
> &lt;meep&gt; inb4 the crypto challenge is a weak RSA implementation on gameboy and you have to find the weakness and forge a signature  
> &lt;ISSOtm&gt; No, not that much xD ~~although next year...~~

Well.
This is AES and not RSA, this is 2022 and not 2020, however we do have a crypto challenge on our hands here.

Ready?
Nah, it's not that bad.

## The challenge

The NPC can issue you a "silver" certificate, and then appraise it.
Your task is to get a "gold" certificate.
(Leaving the room "forfeits" the certificate, so the NPC offers you to generate a new one, btw.)

When you request a certificate, a string like `holder=Aelita/type=silver` is sent to the server.
You can send custom strings (there don't seem to be any size limitations), but there are a bunch of restrictions:

1. It must be a slash-separated list of `key=value` pairs
2. `type` must be present and exactly equal to `silver`, otherwise the server complains
3. Any keys other than `holder` and `type` are ignored
4. The string is not trimmed
5. Multiple values are ignored
6. *Any* instance of `type=gold` anywhere is rejected

...yeah, pretty locked down.
And then, the server returns you the certificate... **encrypted using AES**.

When getting a certificate appraised, you send the encrypted certificate (the *ciphertext*) to the server, which either tells you that something is wrong with it, or returns the decrypted certificate (the *plaintext*) if it's valid.

Yeah. We only get *encrypted* silver certificates to play with, and we gotta get *some* gold certificate.
Somehow.

## A primer on AES

Oh yeah.
What is the Advanced Encryption Standard?

Well, I'll spare you [the obligatory Wikipedia link](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard), as we aren't interested in all of its inner workings here.

AES is what's called a *symmetric* encryption protocol: the same key is used for encrypting and decrypting things.
(Contrast this to RSA, which is *asymmetric*, as it employs a *public* and *private* key.)

AES allows encrypting 128 bits (16 bytes) using uhhh matrix transforms and uhhhhhhhhhhhhh XOR or something?
Yeah, as I said, this is not very important.

What's important is that:
1. Changing one bit in the plaintext will change many in the ciphertext.
2. Changing one bit in the ciphertext will cause many bits to be different in the corresponding plaintext.
3. Even if you have some plaintext and ciphertext, **it's currently infeasible to recover the key**.

So we can basically forget about creating our arbitrary certificates.

## So, wat do?

It might be a good time to mention AES *modes of operation*.
See, I mentioned that AES can only work on "blocks" of 16 bytes (128 bits) at once.
So how is it used for bigger amounts of data?
Simply enough, you slice the data up into 16-byte chunks, and then you encrypt each of them.

The simplest mode of operation is called *ECB* (*Electronic Code Book*), where each block is encrypted independently.

Then there is *CBC*, or *Cipher Block Chaining*, where the last ciphered block[^iv] is XOR'd to the next block's plaintext, and *that* gets ciphered:

[![CBC encryption diagram](https://upload.wikimedia.org/wikipedia/commons/8/80/CBC_encryption.svg)](https://en.wikipedia.org/wiki/File:CBC_encryption.svg)

[There are other modes](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation), but these two are the most common used with AES.
We could easily rule out ECB, as swapping two blocks in the ciphertext does not yield a valid message.
So it's AES-CBC, which leaves us with very little control.

...

...Honestly, we stayed stuck at this point for a while.
Until pfero had a breakthrough.

[^iv]: Well, the first plaintext block being the first, there is no "previous encrypted block", so instead 16 bytes known as the "initialisation vector" (IV) are used.

## Chapter 8: The Part Where He Has A Breakthrough

We had noticed that changing one byte in the ciphertext corrupted not only the corresponding plaintext block, *but also the one after*.
But how come?

[![CBC decryption diagram](https://upload.wikimedia.org/wikipedia/commons/2/2a/CBC_decryption.svg)](https://en.wikipedia.org/wiki/File:CBC_decryption.svg)

Ooh.
What pfero had realized is that the little arrow going from one ciphertext block to the next plaintext block could be our ticket to victory.

See, we have full control over the ciphertext, and the "holder" field is located just before the "type" one.
So, the plan is:

1. Make the "holder" name a length that aligns `type=silver` such that `type=silv` and `er` are on two different blocks.
2. We'll need to "sacrifice" the block just before that; we can simply use part of the holder name, since it doesn't matter.

```python
$ ./client.py cave4gen holder=asdfxxxxxxxxxxxxxxxxhhhhhh/type=silver
b'authority=Cracke'
b'rFour/serial=804'
b'3595/holder=asdf'
b'xxxxxxxxxxxxxxxx'
b'hhhhhh/type=silv'
b'er'
```

Here, "asdf" and "hhhhhh" are used for aligning the `type=` (point 1), and the `xxxxxxxxxxxxxxxx` is our "sacrificial" block (point 2).

Now, it's actually [as simple as](https://doomwiki.org/wiki/Dead_Simple) modifying the `xxxx`'s ciphertext to transmute the `silv` into `gold`!

<figure>
<script id="asciicast-jTVKHa8zoa7OHQtlLadpLLG1j" src="https://asciinema.celforyon.fr/a/jTVKHa8zoa7OHQtlLadpLLG1j.js" async></script>
<figcaption>
<small><a href="https://asciinema.celforyon.fr/a/jTVKHa8zoa7OHQtlLadpLLG1j">Alternate link if the inline player doesn't load</a>, such as if you disabled JavaScript</small>
</figcaption>
</figure>

You can see from the diff (powered and colorized by [delta](https://github.com/dandavison/delta)) that we removed the last block (thus truncating the trailing `er`), and that the last 4 bytes were changed to... magically give us `gold`.

Let's explain that magic a little better.
We know that the `00000040` block decrypts to *something* which, when XOR'd with the *ciphertext* of the `00000030` block, yields `hhhhhh/type=silv`.

I don't particularly care about what that "something" is, I'll instead use XOR's properties:

<figure>
<table style="font-feature-settings: 'calt' off, 'tnum' on;">
<tr><th>Original string (ASCII)</th><td><code>s</code> (0x73)</td><td><code>i</code> (0x69)</td><td><code>l</code> (0x6C)</td><td><code>v</code> (0x76)</td><th><code>s0</code></th></tr>
<tr><th>Target string (ASCII)</th><td><code>g</code> (0x67)</td><td><code>o</code> (0x6F)</td><td><code>l</code> (0x6C)</td><td><code>d</code> (0x64)</td><th><code>s1</code></th></tr>
<tr><th>XOR of the two</th><td>0x14</td><td>0x06</td><td>0x00</td><td>0x12</td><th><code>s0&nbsp;^&nbsp;s1</code></th></tr>
<tr><th>Original <code>00000030</code> block</th><td>0x90</td><td>0xA4</td><td>0x62</td><td>0x8C</td><th><code>b0</code></th></tr>
<tr><th>With the XOR mask applied</th><td>0x84</td><td>0xA2</td><td>0x62</td><td>0x9E</td><th><code>b1</code></th></tr>
</table>
</figure>

...and if you look again at the demonstration, this is exactly what the modified `00000030` block contains!
Here is a more thorough explanation, if you are still having trouble:

> Let `s0` be the original string, `s1` the target string, `b0` the original `00000030` block, and `b1` the new one.
> Additionally, let `p` be the result of decrypting the `00000040` block.
>
> We know that `s0 = p ^ b0` (from the decryption diagram above), and we want `b1` such that `s1 = p ^ b1`.
>
> We can substitute the variables in `s0 ^ s1`, which yields `s0 ^ s1 = (p ^ b0) ^ (p ^ b1)`.
>
> XOR is commutative (`a ^ b = b ^ a`) and associative (`a ^ (b ^ c) = (a ^ b) ^ c`), so we get `s0 ^ s1 = b0 ^ b1 ^ p ^ p`.
>
> Since `a ^ a = 0` and `b ^ 0 = b`, this can be simplified to `s0 ^ s1 = b0 ^ b1`.
>
> We can then XOR both sides with `b0` to get `b0 ^ (s0 ^ s1) = b0 ^ b0 ^ b1`, which gives us the solution `b1 = b0 ^ (s0 ^ s1)`!

Anyway.
As you have seen in the demonstration, this has the server return us a nice lil' gold certificate—whoever the holder is, we don't really care :3[^slashes]

...wait, it's already over?

[^slashes]: Actually, we do care that the corrupted `xxxxxxxxxxxxx` block doesn't accidentally decrypt to any `/` or other "bad" characters. This can be "fixed" by fiddling with the first 6 bytes until this is no longer the case. Those bytes are XOR'd onto the `h` in the holder name, but those can be trashed just fine as well.
