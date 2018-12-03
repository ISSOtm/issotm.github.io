---
title: BGB tips and tricks
permalink: /bgb
layout: single
toc: true
---

[BGB](http://bgb.bircd.org) is a great Game Boy / Game Boy Color emulator by beware. It's very useful, but sometimes, it's a bit obtuse; and there are some functionalities which are undocumented. Here's a collection of protips you should definitely know about when using BGB. And use BGB you must!


## First thing to do

When you open up BGB for the first time, you'll be met with a blank screen. If you're confused, what you need to do there is right-click the window. (Recent enough versions will tell you that in their title bar.)

Best thing to do then is to go to "Other", and open up the debugger.

And, finally, you should read [BGB's manual](http://bgb.bircd.org/manual.html). There is a lot to be found there.


## Getting started on Wine

Wine is a complex thing trying to replicate a complex thing, so it doesn't always work very well. Case in point, BGB seems to fail to start with its default settings on some Wine instances. Often, it's because of a rendering error (DirectX or OpenGL failures, or similar.)

This happens because BGB tries to initialize graphics, which succeeds, but as soon as it starts to render things, Wine throws a trantrum and crashes - which BGB has no way to detect! When this happens, edit your `bgb.ini` file (same folder as `bgb.exe`, only appears after launching BGB once), look for a line beginning with `GfxOut=`, and replace the line with `GfxOut=GDI`. This should (hopefully) fix your problem.


## Symbol files

You may or may not know about symbol files. Basically, they list labels for ASM code. But did you know that BGB's debugger can load them? They need to be in the same directory as the ROM it is attached to, and have the same file name. For example, if you are loading a ROM at `D:\\Games\\game_boy\\dinosaurs_and_nukes_[C]_[!].gbc`, BGB will look for `D:\\Games\\game_boy\\dinosaurs_and_nukes_[C]_[!].sym`.

Also, once you got a SYM file loaded, BGB stops displaying some information. But did you know that you can toggle this? Simply press Tab while in the debugger!


## Reaching out to beware

beware can be reached on IRC: network is EFNet, channel is #gbdev. Don't forget that he's offering BGB for free, and that he owes nothing to you, so be polite.

If you're looking to convince him to open-source BGB, or if you want to peek at the source yourself, forget it.
