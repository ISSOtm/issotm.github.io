#!/usr/bin/python3

charmap = {
	' ': 0x00,
	'0': 0xA1,
	'1': 0xA2,
	'2': 0xA3,
	'3': 0xA4,
	'4': 0xA5,
	'5': 0xA6,
	'6': 0xA7,
	'7': 0xA8,
	'8': 0xA9,
	'9': 0xAA,
	'!': 0xAB,
	'?': 0xAC,
	'.': 0xAD,
	'-': 0xAE,
	'…': 0xB0,
	'“': 0xB1,
	'”': 0xB2,
	'‘': 0xB3,
	'’': 0xB4,
	'♂': 0xB5,
	'♀': 0xB6,
	',': 0xB8,
	'/': 0xBA,
	'A': 0xBB,
	'B': 0xBC,
	'C': 0xBD,
	'D': 0xBE,
	'E': 0xBF,
	'F': 0xC0,
	'G': 0xC1,
	'H': 0xC2,
	'I': 0xC3,
	'J': 0xC4,
	'K': 0xC5,
	'L': 0xC6,
	'M': 0xC7,
	'N': 0xC8,
	'O': 0xC9,
	'P': 0xCA,
	'Q': 0xCB,
	'R': 0xCC,
	'S': 0xCD,
	'T': 0xCE,
	'U': 0xCF,
	'V': 0xD0,
	'W': 0xD1,
	'X': 0xD2,
	'Y': 0xD3,
	'Z': 0xD4,
	'a': 0xD5,
	'b': 0xD6,
	'c': 0xD7,
	'd': 0xD8,
	'e': 0xD9,
	'f': 0xDA,
	'g': 0xDB,
	'h': 0xDC,
	'i': 0xDD,
	'j': 0xDE,
	'k': 0xDF,
	'l': 0xE0,
	'm': 0xE1,
	'n': 0xE2,
	'o': 0xE3,
	'p': 0xE4,
	'q': 0xE5,
	'r': 0xE6,
	's': 0xE7,
	't': 0xE8,
	'u': 0xE9,
	'v': 0xEA,
	'w': 0xEB,
	'x': 0xEC,
	'y': 0xED,
	'z': 0xEE,
	'$': 0xFF,
}

# Script vars are u16


def one_round(string, starting_val, coeffs, addends):
	assert(len(coeffs) == 10)
	assert(len(addends) == 10)
	assert(len(string) == 10)

	var32769 = starting_val
	for c,n,x in zip(string,coeffs,addends):
		var32769 = (var32769 + charmap[c]) % 65536
		var32769 = (var32769 * n) % 65536
		var32769 = (var32769 + x) % 65536
	return var32769

round1 = (6969, [73, 97, 13, 41, 67, 101, 89, 139, 71, 83], [6367, 5099, 4591, 4421, 4831, 3581, 5039, 5279, 4079, 4021])
round2 = (1337, [59, 181, 127, 163, 103, 163, 149, 193, 211, 151], [3701, 4603, 4663, 4703, 4219, 6481, 6983, 5407, 5297, 5099])
def get_hash_for(string):
	var32771 = one_round(string, *round1)
	var32769 = one_round(string, *round2)
	return hex(var32771),hex(var32769)


def get_unk_coeffs(round):
	constant = one_round("          ", *round)
	coeffs = []
	for c in round[1]:
		for i in range(len(coeffs)):
			coeffs[i] = (coeffs[i] * c) % 65536
		coeffs.append(c)
	return constant,coeffs

simple_round1 = get_unk_coeffs(round1)
simple_round2 = get_unk_coeffs(round2)

def simple_round(string, starting_val, coeffs):
	return (starting_val + sum([ (charmap[char] * coeff) % 65536  for (char,coeff) in zip(string,coeffs) ])) % 65536

def simple_hash(string):
	var32771 = simple_round(string, *simple_round1)
	var32769 = simple_round(string, *simple_round2)
	return hex(var32771),hex(var32769)


print(get_hash_for("0123456789"), simple_hash("0123456789"))
print(get_hash_for("$$$$$$$$$$"), simple_hash("$$$$$$$$$$"))
print(get_hash_for("ABABABABAB"), simple_hash("ABABABABAB"))
print(get_hash_for("6969696969"), simple_hash("6969696969"))


def print_simple(starting_val, coeffs, target):
	print(coeffs, (target - starting_val) % 65536)

print_simple(*simple_round1, 45295)
print_simple(*simple_round2, 54457)


def round_constant(string, constant, coeffs):
	return constant + sum(c * n for c,n in zip(string,coeffs))
def round_coeffs(input_len, _, coeffs):
	return coeffs[input_len - 2],coeffs[input_len - 1]

# Trying to solve the system:
# { a1 * x + b1 * y = c1
# { a2 * x + b2 * y = c2
def solve_for(a1,b1,c1,a2,b2,c2):
	# Begin by solving for X: eliminate Y!
	a1_ = (a1 * b2) % 65536
	c1_ = (c1 * b2) % 65536
	a2_ = (a2 * b1) % 65536
	c2_ = (c2 * b1) % 65536
	a_ = (a2_ - a1_) % 65536
	c_ = (c2_ - c1_) % 65536
	# We know that `a_ * x = c_` modulo 65536
	# TODO

# 0123456789
#
# ??$$$$$$$$
# _??$$$$$$$
# A??$$$$$$$
# B??$$$$$$$
# ...
def solve():
	charset_bytes = list(charmap.values())
	charset = list(charmap.keys())

	string = [0xFF] * 10
	for input_len in range(2, 11):
		# Set the two unknown characters
		string[input_len - 2] = 0
		string[input_len - 1] = 0

		print(input_len)

		a1,b1 = round_coeffs(input_len, *simple_round1)
		a2,b2 = round_coeffs(input_len, *simple_round2)
		while True:
			cst1 = round_constant(string, *simple_round1)
			cst2 = round_constant(string, *simple_round2)
			# chr1,chr2 = solve_for(a1,b1,cst1,a2,b2,cst2)
			# if chr1 in charmap.values() and chr2 in charmap.values():
			# 	print(string)
			# Idk man, just bruteforce it for now
			for c1 in charset_bytes:
				for c2 in charset_bytes:
					if (a1 * c1 + b1 * c2 + cst1) % 65536 == 45295 and (a2 * c1 + b2 * c2 + cst2) % 65536 == 54457:
						cpy = string[:]
						cpy[input_len - 2] = c1
						cpy[input_len - 1] = c2
						print("".join([charset[charset_bytes.index(b)] for b in cpy]))

			# Advance to next string prefix
			for i in range(input_len - 2):
				idx = charset_bytes.index(string[i]) + 1
				if idx != len(charset_bytes):
					string[i] = charset_bytes[idx]
					break
				else:
					string[i] = charset_bytes[0]
			else:
				break # Exhausted all input prefixes
		string[input_len - 2] = charset_bytes[0]

solve()
