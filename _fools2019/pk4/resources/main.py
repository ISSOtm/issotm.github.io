#!/usr/bin/env python3

from sys import argv


def get_gb_bytes(file, bank, addr, nb_bytes):
    file.seek(bank * 0x2000 + addr - 0xA000)
    return file.read(nb_bytes)

def get_LE_bytes(bytes):
    return int.from_bytes(bytes, "little")


instr_names = ["\tSetReadPtr {}", "\tInitChecksumByte {}", "\tReadBufferByte", "\t?? (04)", "\tScramble", "\tRotateBuffer", "\tWriteLong {}", "\tUpdateChecksum", "\tUpdateChecksum2", "\t?? (0A)", "\tWriteChecksum", "\tDjnz {}, {}", "\t?? (0D)", "\t?? (0E)"]
arg_sizes   = [2,                 1,                       0,                  None,        0,            0,                4,                0,                  0,                   None,        0,                 3,               0,           0]


read_bank = 2
read_ptr = 0xB0B3
instructions = []
labels       = []

try:
    with open(argv[1], "rb") as sav_file:
        while True:
            instr_id = get_LE_bytes(get_gb_bytes(sav_file, read_bank, read_ptr, 1)) - 1 # Indexing starts at 1, huh.
            instructions.append({ "addr": read_ptr, "instr": instr_id })
            read_ptr += 1
            if instr_id == 0x0C - 1:
                # djnz is a bit special
                instructions[-1]["arg2"] = get_LE_bytes(get_gb_bytes(sav_file, read_bank, read_ptr, 2))
                read_ptr += 2
                instructions[-1]["arg"]  = get_LE_bytes(get_gb_bytes(sav_file, read_bank, read_ptr, 1))
                read_ptr += 1
                labels.append(instructions[-1]["arg2"])
            elif arg_sizes[instr_id] == None:
                raise ValueError
            elif arg_sizes[instr_id] != 0:
                instructions[-1]["arg"]  = get_LE_bytes(get_gb_bytes(sav_file, read_bank, read_ptr, arg_sizes[instr_id]))
                read_ptr += arg_sizes[instr_id]
except ValueError:
    print("Encountered unknown instruction @ {}".format(hex(read_ptr - 1)))

label_id = 1
for instruction in instructions:
    try:
        labels.index(instruction["addr"])
        print(".loop{} ; @ {}".format(label_id, hex(instruction["addr"])))
        label_id += 1
    except ValueError:
        pass
    print(instr_names[instruction["instr"]].format(hex(instruction.get("arg", 0)), hex(instruction.get("arg2", 0))))
