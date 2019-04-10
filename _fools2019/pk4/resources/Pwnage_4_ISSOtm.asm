Functions~
I rewrote some in higher-level pseudocode, maybe it was a mistake

BufferReadPtr       EQU $ADAE
ChecksumByte        EQU $ADB0
ScramblingBuffer    EQU $ADB1
OutBufWrappingByte  EQU $ADB5
BytecodePtrSave     EQU $ADB6
CursorSpinTimer     EQU $ADB8
OUTPUT_BUFFER       EQU $C800

; AE21 = $00, AE26 = $AE2C
Dispatch: de {8:AE21} {16:AE26}
    sp = [16:{16:AE26} + {8:AE21} << 8 + [16:de] * 2] ; $AE2C @ AE26, $00 @ AE21
    de++

AE2C SP table:
[?] 00  1708
[2] 01  AEF3 SetReadPtr         ; formerly known as WriteWord
[1] 02  AF09 InitChecksumByte   ; formerly known as WriteByte
[0] 03  AF19 ReadBufferByte     ; formerly known as CopyByte
[0] 04  AE4A HaltAndFinalize
[0] 05  AF3B Scramble
[0] 06  AF85 RotateBuffer
[4] 07  AFE3 WriteLong
[0] 08  B005 UpdateChecksum
[0] 09  B013 UpdateChecksum2
[?] 0A  0000
[0] 0B  B033 WriteChecksum
[3] 0C  B07D Djnz
[0] 0D  B045 saveChecksumByteAndBufferReadPTR ??? ; Writes InitChecksumByte's written byte..?
[0] 0E  B069 loadChecksumByte
After this is AE4A

; AEF5 = BufferReadPtr, AF05 = Dispatch
SetReadPtr: de {16:AEF5} {16:AF05}
    [16:{16:AEF5}] = [16:de] ; BufferReadPtr @ AEF5
    de += 2
    sp = {16:AF05} ; Dispatch @ AFO5

; AFOB = ChecksumByte, AF15 = Dispatch
InitChecksumByte: de {16:AF0B} {16:AF15}
    [ 8:{16:AF0B}] = [ 8:de] ; ChecksumByte @ AFOB
    de++
    sp = {16:AF15} ; Dispatch @ AF15

; From [16:{16:AF1B}] to {16:AF31}
; Note: assumes {16:AF1B} == {16:AF27}
; AF1B = BufferReadPtr, AF27 = BufferReadPtr, AF31 = OUTPUT_BUFFER, AF3D = ScramblingBuffer
ReadBufferByte: de {16:AF1B} {16:AF27} {16:AF31} {16:AF37}
    pop hl ; BufferReadPtr @ AF1B
    hl = [16:{16:AF1B}]
    {16:AF27} = hl + 1 ; BufferReadPtr @ AF27
    [8:{16:AF31}] = [8:hl] ; OUTPUT_BUFFER @ AF31
    sp = {16:AF37} ; Dispatch @ AF37

; AF3D = ScramblingBuffer, AF79 = OUTPUT_BUFFER, AF81 = Dispatch
Scramble: de {16:AF3D} {16:AF79} {16:AF81}
    pop hl ; ScramblingBuffer @ AF3D
    inc [hl]
    ld b, [hl]
    inc hl
    inc hl
    inc hl
    ld a, [hld]
    xor b
    ld b, a
    ld a, [hld]
    ld a, [hl]
    xor b
    ld [hli], a
    ld b, a
    ld a, [hl]
    add a, b
    ld [hli], a
    srl a
    ld b, a
    ld a, [hld]
    add a, b
    ld b, a
    ld a, [hld]
    ld a, [hli]
    xor b
    inc hl
    ld [hli], a
    pop hl ; OUTPUT_BUFFER @ AF79
    xor [hl]
    ld [hli], a
    pop hl ; Dispatch @ AF81
    ld sp, hl

; AF87 = CursorSpinTimer, AF8F = $07FC, AF96 = $C0, AF9B = CursorSpinTimer, AFA7 = BytecodePtrSave, AFB1 = OUTPUT_BUFFER, AFB7 = OutBufWrappingByte, AFBD = $01B0,
; AFBF = OUTPUT_BUFFER, AFC1 = $C801, AFC3 = $FF00, AFC9 = OutBufWrappingByte, AFCF = $C9AF, AFD5 = BytecodePtrSave, AFDF = Dispatch
RotateBuffer: {16:AF87} {16:AF8F} {8:AF96} {16:AF9B} {16:AFA7} {16:AFB1} {16:AFB7} {16:AFBD} {16:AFBF} {16:AFC1} {8:AFC4} {16:AFC9} {16:AFCF} {16:AFD5} {16:AFDF}
    pop hl ; CursorSpinTimer @ AF87
    ld a, [hld]
    inc a
    pop hl ; $07FC @ AF8F
    or [hl] ; [$07FC] = $C0 => or $C0
    pop bc ; $C000 @ AF95
    xor b ; Basically `and $C0`
    pop hl ; CursorSpinTimer @ AF9B
    ld [hli], a
    and a
    call z, SpinCursor

    pop hl ; BytecodePtrSave @ AFA7
    ld a, e
    ld [hli], a
    ld [hl], d
    pop hl ; OUTPUT_BUFFER @ AFB1
    ld a, [hli]
    pop hl ; OutBufWrappingByte @ AFB7
    ld [hli], a
    pop bc ; $01B0 @ AFBD
    pop de ; OUTPUT_BUFFER @ AFBF
    pop hl ; $C801 @ AFC1
    pop af ; $FF00 @ AFC3
    call ReadBufferBytes
    pop hl ; OutBufWrappingByte @ AFC9
    ld a, [hli]
    pop hl ; $C9AF @ AFCF
    ld [hli], a
    pop hl ; BytecodePtrSave @ AFD5
    ld a, [hli]
    ld d, [hl]
    ld e, a
    pop hl ; Dispatch @ AFDF
    ld sp, hl

; AFE5 = ScramblingBuffer, B001 = Dispatch
WriteLong: de {16:AFE5} {16:B001}
    [32:{16:AFE5}] = [32:de] ; ScramblingBuffer @ AFE5
    de += 4
    sp = {16:B001} ; Dispatch @ B001

; B007 = $ADCC, B009 = $8600, B00F = $B01B, B01D = ChecksumByte, B023 = OUTPUT_BUFFER, B029 = ChecksumByte, B02F = Dispatch
UpdateChecksum: de {16:B007} {8:B009} {16:B00F} {16:B01D} {16:B023} {16:B029} {16:B02F}
    pop hl ; $ADCC @ B007
    pop af ; $8600 @ B009
    ld [hli], a
    pop hl ; $B01B @ B00F
    ld sp, hl
B01B: ; This is where it jumps to
    pop hl ; ChecksumByte @ B01D
    ld a, [hli]
    pop hl ; OUTPUT_BUFFER @ B023
    add a, [hl]
    pop hl ; ChecksumByte @ B029
    ld [hli], a
    pop hl ; Dispatch @ B02F
    ld sp, hl

; B015 = $ADCC, B017 = $AE00, B01D = ChecksumByte, B023 = OUTPUT_BUFFER, B029 = ChecksumByte, B02F = Dispatch
UpdateChecksum2: de {16:B015} {8:B018} {16:B01D} {16:B023} {16:B029} {16:B02F}
    pop hl ; $ADCC @ B015
    pop af ; $AE00 @ B017
    ld [hli], a
    pop hl ; ChecksumByte @ B01D
    ld a, [hli]
    pop hl ; OUTPUT_BUFFER @ B023 //buffer?
    add a, [hl]
    pop hl ; ChecksumByte @ B029
    ld [hli], a
    pop hl ; Dispatch @ B02F

; B035 = ChecksumByte, B03B = OUTPUT_BUFFER, B041 = Dispatch
WriteChecksum: de {16:B035} {16:B03B} {16:B041}
    pop hl ; ChecksumByte @ B035
    ld a, [hli]
    pop hl ; OUTPUT_BUFFER @ B03B
    ld [hli], a
    pop hl ; Dispatch @ B041

; B08F = Dispatch, B0A1 = Dispatch, B0AF = Dispatch
Djnz: de {16:B08F} {16:B0A1} {16:B0AF}
    ld a, [de]
    ld c, a
    inc de
    ld a, [de]
    ld b, a
    inc de
    ld a, [de]
    inc de
    pop hl ; Dispatch @ B08F
    and a
    ret z
    dec a
    dec de
    ld [de], a
    inc de
    pop hl ; Dispatch = B0A1
    ret z
    ld d, b
    ld a, c
    ld e, a
    pop hl ; Dispatch @ B0AF

; Copies ChecksumByte @ B047 to [BufferReadPtr @ B04D]. Saves [BufferReadPtr @ B04D] + 1 to BufferReadPtr @ B05B
; B047 = ChecksumByte, B04D = BufferReadPtr, B05B = BufferReadPtr, B065 = Dispatch
saveChecksumByteAndBufferReadPTR: de {16:B047} {16:B04D} {16:B05B} {16:B065}
    pop hl ; ChecksumByte @ B047
    ld b, [hl] ; Loads ChecksumByte @ B047 into b
    pop hl ; BufferReadPtr @ B04D
    hl = [16:hl]
    ld [hl], b ; Saves the ChecksumByte inside [[BufferReadPtr @ B04D]]
    inc hl
    ld b, h
    ld c, l ; bc = [BufferReadPtr @ B04D] + 1
    pop hl ; BufferReadPtr @ B05B
    ld [hl], c
    inc hl
    ld [hl], b ; Saves the BC pointer inside BufferReadPtr @ B05B
    pop hl ; Dispatch @ B065

; Copies [[BufferReadPtr @ B06B]] to ChecksumByte @ B073
; B06B = BufferReadPtr, B073 = ChecksumByte, B079 = Dispatch
loadChecksumByte: de {16:B06B} {16:B073} {16:B079}
    pop hl ; BufferReadPtr @ B06Bde
    hl = [16:hl]
    ld a, [hli]
    pop hl ; ChecksumByte @ B073
    ld [hli], a
    pop hl ; Dispatch @ B079

HaltAndFinalize:
    pop bc ; $0100 @ AE4C
    pop de ; $CB00 @ AE4E
    pop hl ; $AE58 @ AE51
    pop af ; $FF00 @ AE53

    CopyBytes: (
        hl to de
        for bc bytes
    )

    ; originally in AE58, from cb00 after copy
    ld sp, wMusicPlaying
    call SwitchSRAMBank3 ; D92E
    ld bc, $01B0
    ld de, $A100
    ld hl, wOverworldMap
    call CopyBytes
    call SwitchSRAMBank2 ; D920
    ld a, $01
    ld [$A0007], a
    call NormalSpeed
    xor a
    ld [$ff0f], a
    ld a, 0f
    ld [$ffff], a
    ei ; this is really the end of the zvm here
    call delayFrame
    ld de, $0025
    call PlaySfx
    ld c, $32
    call DelayFrames
    ld hl, $cb49
    call PrintVWFText
    call CloseSram ; making sure unless he is tricking us more
    ld c, $01
    ld a, $11
    ld [$ff0c], a
    add a
    ld [$ff0c], a
    cpl
    ld [$ff0c], a
    xor a
    ld [$ff0c], a
    jp AE9F ; new bank, dunno which

    ...
    etc. I hope nothing else happens.


@ ( switchsrambank stuffs
    @     ld a, $03
    @     ;jmp
    @     ld [$df35], a
    @     ld [$4000], a
    @     ld a, $0A
    @     ld [$0000], a
    @     ret
    @ )