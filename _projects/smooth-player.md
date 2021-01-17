---
title: "Smooth-Player"
permalink: /projects/smooth-player
layout: single
excerpt_separator: <!--more-->
---

[Smooth-Player](//github.com/ISSOtm/smooth-player) is a system that allows stereo 4-bit sample playback at variable rates up to \~16 kiHz on Game Boy, Game Boy Color, and Game Boy Advance consoles.

<figure>
    Sample sample:
    <audio controls preload="metadata">
        <source src="/gb_sample.ogg" type="audio/ogg">
        <a href="/gb_sample.ogg">click here</a>
    </audio>
</figure>

This post will detail how the system works; if you only seek to use or get a demo of the system, please follow the link above.
<!--more-->

## Credit where credit is due

[Liji](//twitter.com/LIJI32) figured the way the Game Boy's APU works and theorized the sample player long before I got involved; they also designed their own 3-bit stereo player for use in [Game Boy Video Player 2](//github.com/LIJI32/GBVideoPlayer2).

They also initially tweeted [this](//twitter.com/liji32/status/964555034011815936), which is relatively accurate.

## A primer on the GB APU

First, what does <dfn><abbr>APU</abbr></dfn> stand for? It means "Audio Processing Unit", and is basically the chip responsible for generating the Game Boy's audio.

Now we need to talk about what kind of audio the Game Boy is able to produce. I'll gloss over details and bugs, and talk about the *intended* interface. There are 4 sound channels, which each independently generate a signal (a wave, if you want), each with a specific shape. Each channel is referred to as "CHx", x being a digit between 1 and 4.

It's not too big of a deal if you don't get everything in that section, a general understanding is important to grasp what's next.

CH1 and CH2 are pretty simple and almost identical: they produce a [square wave](//en.wikipedia.org/wiki/Square_wave) at a given frequency and volume; there is also a feature called "envelope sweep" which more or less allows increasing or decreasing the volume automatically. The [duty cycle](//en.wikipedia.org/wiki/Duty_cycle) of each signal, which basically describes the ratio between the amount of time spent "high" and spent "low", can be set independently. And finally, CH1 benefits from a "frequency sweep" feature, which allows its frequency to automatically increase or decrease.

CH3 is what's called a "wavetable" or "voluntary wave" channel; the wave it outputs is directly defined by writing to a region of memory. The output can be divided to reduce the volume while playing, and the playback frequency is also settable. No sweeping features are available, though.

CH4 is a [noise](//en.wikipedia.org/wiki/White_noise) channel; it's roughly a square wave, but switches between "high" and "low" randomly at a very high frequency. The frequency and volume can be configured just like CH1 & 2, and the envelope sweep functionality is also present.

Finally, all channels are mixed together and split between left and right, which channels go where being user-controllable, then can be scaled to a certain volume (yes, the volume is stereo). And, there is a global toggle to turn off the entire APU, which amongst other things saves power.

## How things really work

Now, this is the Game Boy we're talking about. This is 90's hardware that was built for small power consumption, so we're bound to have bugs and implementation details leaking through. And what would you know, we have those, and yeah, it's what smooth-player runs on. Strap in!

Each channel is split in two parts: a digital "generation circuit", and a [DAC](//en.wikipedia.org/wiki/Digital-to-analog_converter). The output (which is analog, mind you) is then added to other channels as specified by NR51, scaled as specified by NR50, and finally each "output" is fed to a [high-pass filter](//en.wikipedia.org/wiki/High-pass_filter), which essentially is there to ensure the signal's average stays at zero.

Why is it there? Well, every DAC enabled adds a DC offset to the overall signal (this is a side effect of the cheap and power-efficient tech Nintendo used), which the high-pass filter is there to smooth out.

You would expect the DAC and generation circuit of each channel to be controlled together, but it's not the case; instead, they're controlled independently. This means a channel can essentially be in three states:

- Disabled: the DAC is off, nothing comes out of it
- Enabled: the DAC and generation circuit are on, the channel works as expected
- Inactive: the DAC is on but not the generation circuit, the channel uuhhh

In that last case, the generation circuit feeds zeros to the DAC, which is thus stuck outputting a constant offset.

## Playing sound samples&mdash;The Easy Way

The [easiest way to play sound samples](//github.com/DevEd2/SamplePlayer) is to use CH3, which seems tailored to do so. CH3 has room for 32-unit samples; how do we play samples longer than that? Simple: just as the last unit finishes playing, we turn off CH3, refill the buffer, and turn it on again. Turning off is necessary to properly access the buffer.

But now we have a few issues; turning off the channel means disabling the DAC, which causes a DC offset change, same when turning it back on. This change is too fast for the high-pass filter to react, and essentially means there's a spike every 32th unit being played, which results in an annoying buzz throughout playback.

## Playing sound samples&mdash;The Smooth Way

Okay, so playing back using CH3 is fundamentally flawed. I've considered using another channel to compensate for the DC offset, but there's another complication related to how CH3 reads the wave buffer. We need to think outside the box.

The strategy used is that each channel plays a constant value (which isn't audible, mind you), but they're constantly toggled in and out of mixing through NR51. This essentially turns each channel into a "bit", and NR51 is used as a makeshift DAC. Whew!

The problem is to get each channel to play a constant offset: CH3 is easy enough, we just specify a constant wave, but what about the other three? CH4 being the most chaotic one, it's taken care of by putting it in an inactive state. CH1 and CH2 are more tricky; the trick is to keep restarting them so they stay in a "high" state.

CH1 and 2 are really special here. See, the way the square waves' duty cycles are implemented is, both channels have a table determining when it should be high, and when it should be low. *This index cannot be controlled or reset*, except by turning off the APU, which sets it to 0. Even better, restarting the channels does not alter this index; however, it resets the timer that causes the index to advance, so by restarting the channels often enough, they stay constant.

Phew! So basically, we have a timer interrupt that reads a sound sample byte, writes it to NR51, and restarts CH1 and 2 as described above. It works great!

## Advancing ruins it all

...except on GBA, where it sounds like garbage. What went wrong? The answer is manifold, so strap in if you unstrapped from the previous section. Or double-strap, you can't be too prudent.

Remember [the explanation above](#how-things-really-work)? You can forget it! GBA works wildly differently. First, there are no DACs, all mixing happens digitally; since there are no DACs, we can retrofit that into our previous model by considering that DACs are permanently enabled. Further, the "inactive" trick doesn't work anymore.

CH1 and 2 work identically, CH3 still reads a constant wave, but we need to handle CH4 differently. How can we get it to play a constant wave? The answer lies in the random number generator backing the channel. This RNG is what's called a [LFSR](//en.wikipedia.org/wiki/Linear-feedback_shift_register), which basically revolves around shifting bits out of a register that gets pseudo-randomly refilled at the other hand.

Here's a more involved explanation: CH4 has a 15-bit register, and each time it's "clocked", the entire register is shifted right. The bit shifted out is used as output (if it's 1, CH4 goes high, otherwise it goes low), and the bit shifted in is the complement of the XOR of the bottom two bits (before shifting, mind you). The LFSR is initialized to 0, so here are the first few values that it goes through:

1.  000 0000 0000 0000
2.  100 0000 0000 0000
3.  110 0000 0000 0000
4.  111 0000 0000 0000
5.  111 1000 0000 0000
6.  ...
7.  111 1111 1111 1100
8.  111 1111 1111 1110
9.  011 1111 1111 1111
10. 101 1111 1111 1111

And so on. This LFSR has an interesting property: if it's set to all 1's, it will stay at that value. Luckily, this means CH4 would output a constant, which is exactly what we want! But, that value is normally unreachable&mdash;we saw above that we were so close to it, but no dice, right? Well, there's a feature of CH4's LFSR that I didn't mention so far: its length can be changed.

What I described above is the 15-bit "long" mode; in the 7-bit "short" mode, the bit shifted in is *also* shifted in at bit 6. So, repeating the above but in 7-bit mode, the LFSR would take the following values:

1.  000 0000 0000 0000
2.  100 0000 0100 0000
3.  110 0000 0110 0000
4.  111 0000 0111 0000
5.  111 1000 0111 1000
6.  111 1100 0111 1100
7.  111 1110 0111 1110
8.  011 1111 0011 1111
9.  101 1111 1101 1111
10. 110 1111 1110 1111

And so on. You can see that we basically get the same result, just much faster. How is that relevant to getting the LFSR to all ones? Well, get this: the width can be changed *at any time*! Look at steps 9 and 10 in the 15-bit mode list: the lower 7 bits are all zeros! If we switch the LFSR before that lone 0 bit reaches the lower 7 bits, the LFSR will be filled with ones, and we will have achieved our goal! Hooray!

Oh, and also, we had to figure out that CH3's output is inverted. Go figure.

## State of emulation

Currently, as far as I'm aware, the single emulator to correctly play Smooth-Player samples is Liji's [SameBoy](//github.com/LIJI32/SameBoy). [BGB](http://bgb.bircd.org) does not properly emulate all the audio system, taking shortcuts for efficiency.

However, Smooth-Player works fine in SameBoy's GBA mode, whereas it's broken on actual GBA hardware; I hope to fix Smooth-Player on hardware, but this is making it more difficult.

Stay tuned!
