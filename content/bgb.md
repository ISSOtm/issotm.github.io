+++
title = "BGB tips and tricks"
+++

[BGB](//bgb.bircd.org) is a great Game Boy / Game Boy Color emulator by beware. It's very useful, but sometimes, it's a bit abstruse; and there are some functionalities which are undocumented. Here's a collection of protips you should definitely know about when using BGB. And use BGB you must!

<!-- more -->

(If any of these tricks doesn't work, or you've found your own, you can [open an issue](//github.com/ISSOtm/issotm.github.io/issues), [send a PR](//github.com/ISSOtm/issotm.github.io) or just [reach out to me](mailto:eldredhabert0@gmail.com).)

## First thing to do

When you open up BGB for the first time, you'll be met with a blank screen. If you're confused, what you need to do there is right-click the window. (Recent enough versions will tell you that in their title bar.)

Best thing to do then is to go to "Other", and open up the debugger.

And, finally, you should read [BGB's manual](//bgb.bircd.org/manual.html). There is a lot to be found there.


## Getting started on Wine

Wine is a complex thing trying to replicate a complex thing, so it doesn't always work very well. Case in point, BGB seems to fail to start with its default settings on some Wine instances. Often, it's because of a rendering error (DirectX or OpenGL failures, or similar.) The problem should be fixed on BGB versions starting with 1.5.8, the Direct3D error should be caught and OpenGL be the new default renderer.

This happens because BGB tries to initialize graphics, which succeeds, but as soon as it starts to render things, Wine throws a trantrum and crashes - which BGB has no way to detect! When this happens, edit your `bgb.ini` file (same folder as `bgb.exe`, only appears after launching BGB once), look for a line beginning with `GfxOut=`, and replace the line with `GfxOut=GDI`. This should (hopefully) fix your problem.

A simpler solution seems to be installing the packet `libxcomposite` (the 32-bit version, normally), which should make Direct3D work.


## Symbol files

You may or may not know about symbol files. Basically, they list labels for ASM code. But did you know that BGB's debugger can load them? They need to be in the same directory as the ROM it is attached to, and have the same file name. For example, if you are loading a ROM at `D:\\Games\\game_boy\\dinosaurs_and_nukes_[C]_[!].gbc`, BGB will look for `D:\\Games\\game_boy\\dinosaurs_and_nukes_[C]_[!].sym`.

Also, once you got a SYM file loaded, BGB stops displaying some information. But did you know that you can toggle this? Simply press Tab while in the debugger!


## Input polling

There's a fairly obscure thing BGB does to improve your life. When a ROM reads the joypad in a "consistent" manner (ie. roughly on the same scanline each time), then BGB is able to provide the input directly to the ROM, which removes one frame of input lag. (If you don't know what input lag is, trust me, you don't want it.)

How do you check if you're hitting that special mode? There's a simple solution: press Ctrl+Shift+9, and you'll see a bar near the top of the screen. If the left part of the bar is black, you're good to go. If it's purple, then you've hit the mode with the extra frame of lag.

Be careful that beware has stated that this is an internal debug feature that may change or go away on a whim.


## Quick navigation

Here are fairly obscure yet practical shortcuts that I couldn't find documented:

- When the current instruction, in the code viewer, accesses memory, pressing right on it will have the data viewer jump to that location. It even works with register-indexed instructions (`ld a, [hl]`), and `jp`/`call`!
- The Ctrl+G "Goto" box doesn't just accept memory addresses, it also works with labels (`OverworldLoop`) and registers (`de`, `pc`). Also, it works with labels in `Global.local` format (`OverworldLoop.notPressed`), or just `.local` in the current scope (`OverworldLoop` then `.notPressed`).


## Reaching out to beware

beware can be reached on IRC: network is EFNet, channel is #gbdev. Don't forget that he's offering BGB for free, and that he owes nothing to you, so be polite.

If you're looking to convince him to open-source BGB, or if you want to peek at the source yourself, forget it.
