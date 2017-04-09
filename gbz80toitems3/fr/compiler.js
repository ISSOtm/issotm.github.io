
// Because it IS better !
'use strict';


// Hexadecimal digits.
var hexits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
// Converts hex (a hex number as a string) into its decimal counterpart.
// hex's letters must be caps. (use String.toUpperCase())
function hexToDec(hex) {
	var dec = 0;
	// Avoid recalculating hex.length...
	var n = hex.length;
	
	for(var i = 0; i < n; i++) {
		var hexitDec = hexits.indexOf(hex[i].toLowerCase());
		// Check if it's a valid hex during translation
		if(hexitDec == -1) {
			throw new AsmError('Hexadécimal invalide : ' + hex);
		}
		
		dec = dec * 16 + hexitDec;
	}
	
	return dec;
}

// Performs the opposite as hexToDec.
function decToHex(dec) {
	var hex = '';
	
	while(dec || hex.length < 2) {
		hex = hexits[dec % 16] + hex;
		dec = Math.floor(dec / 16);
	}
	
	return hex;
}

// Needs no explanation.
function binToDec(bin) {
	var dec = 0;
	var n = bin.length;
	
	for(var i = 0; i < n; i++) {
		dec *= 2;
		
		if(bin[i] == '1') {
			dec++;
		} else if(bin[i] != '0') {
			throw new AsmError('Binaire invalide : ' + bin);
		}
	}
	
	return dec;
}

// Give a hex number in the usual format, attempt to extract the hex part.
// If success return the decimal, otherwise return NaN.
var regHex = /^(\$|hex::?|0x)?([0-9A-Fa-f]+)(h|H)?$/;
function parseHex(str) {
	if(typeof str != 'string') {
		throw new TypeError('Je m\'attendais à une chaîne de caractères !');
	}
	
	// We need either a prefix or a suffix, but not both.
	if(str.match(regHex) && (RegExp.$1 != '') != (RegExp.$3 != '')) {
		return hexToDec(RegExp.$2);
	} else {
		throw new AsmError(str + ' est de l\'hexadécimal mal formaté !');
	}
}

// Same.
var regBin = /^(%|bin::?|0b)?([01]+)(b|B)?$/;
function parseBin(str) {
	if(typeof str != 'string') {
		throw new TypeError('Je m\'attendais à une chaîne de caractères !');
	}
	
	// We need either a prefix or a suffix, but not both.
	if(str.match(regBin) && (RegExp.$1 != '') != (RegExp.$3 != '')) {
		return binToDec(RegExp.$2);
	} else {
		throw new AsmError(str + ' est du binaire mal formaté !');
	}
}



// Custom error type. HEEEELL YEAAAA.
function AsmError(message) {
	this.message = message || '';
	
	// Remove the call to this constructor from the stack.
	var stack = (new Error()).stack.split('\n');
	this.stack = this.stack || stack.slice(1).join('\n');
	
	// Add info on the caller - this is where the exception is being thrown, after all.
	var callerInfo = stack[1].slice(stack[1].indexOf('@') + 1).split(':');
	this.fileName = this.fileName || callerInfo.slice(0, -2).join(':');
	this.lineNumber = this.lineNumber || parseInt(callerInfo.slice(-2, -1)) || '';
	this.columnNumber = this.columnNumber || parseInt(callerInfo.slice(-1)) || '';
	
	console.error(message);
}
AsmError.prototype = Object.create(Error.prototype);
AsmError.prototype.constructor = AsmError;
AsmError.prototype.name = 'AsmError';



// Global vars. Flushed before use anyways.
var byteStream = [], currentGlobalLabel = '', labels = [];
// Used for syntax checking.
var reg8  = ['b', 'c', 'd', 'e', 'h', 'l', '(hl)', 'a'],
	reg16 = ['bc', 'de', 'hl', 'af'],
	conds = ['nz', 'z', 'nc', 'c'];

function readByte(operand) {
	if(operand.length != 1) {
		throw new AsmError('Un seul argument est attendu pour readByte !');
	} else if(operand[0] == '') {
		throw new AsmError('L\'argument est vide !');
	}
	
	operand = operand[0];
	var number = operand;
	if(operand.match(/^\d+$/)) {
		// Decimal
		number = parseInt(operand);
	} else if(operand.match(regHex)) {
		// Hex
		number = parseHex(operand);
	} else if(operand.match(regBin)) {
		// Bin
		number = parseBin(operand);
	} else if(typeof operand == 'string') {
		// Label
		byteStream.push({size: 1, name: operand, isLabel: false});
		return 1;
	} else {
		throw new AsmError('Un argument invalide a été passé à readByte !');
	}
	
	if(number < 0 || number > 256) {
		throw new AsmError(operand + ' n\'est pas un nombre 8-bit !');
	} else {
		byteStream.push(number);
	}
	
	return 1;
}

function readWord(operand) {
	if(operand.length != 1) {
		throw new AsmError('Un seul argument est attendu pour readWord !');
	} else if(operand[0] == '') {
		throw new AsmError('L\'argument est vide !');
	}
	
	operand = operand[0];
	var number = operand;
	if(operand.match(/^\d+$/)) {
		// Decimal
		number = parseInt(operand);
	} else if(operand.match(regHex)) {
		// Hexadecimal
		number = parseHex(operand);
	} else if(operand.match(regBin)) {
		// Binary
		number = parseBin(operand);
	} else if(typeof operand == 'string') {
		// Label
		byteStream.push({size: 2, name: operand, isLabel: false});
		byteStream.push(0);
		return 2;
	} else {
		throw new AsmError('Un argument invalide a été passé à readWord !');
	}
	
	if(number < 0 || number > 65535) {
		throw new AsmError(operand + ' n\'est pas un nombre 16-bit !');
	} else {
		byteStream.push(number % 256);
		byteStream.push(Math.floor(number / 256));
	}
	
	return 2;
}

function determineLdType(operand) {
	if(operand.length != 2) {
		throw new AsmError('ld requiert deux opérandes !');
	}
	
	var target = reg8.indexOf(operand[0]);
	var dest;
	if(target != -1) {
		// Check for a reg8 target.
		dest = reg8.indexOf(operand[1]);
		if(dest != -1) {
			// That's reg8 to reg8. The easy one.
			
			byteStream.push(64 + target * 8 + dest);
			return 1;
		} else if(target == 7 && operand[1][0] == '(' && operand[1][operand[1].length - 1] == ')') {
			// A memory load to a.
			if(operand[1] == '(bc)') {
				// ld a, (bc)
				
				byteStream.push(10);
				return 1;
			} else if(operand[1] == '(de)') {
				// ld a, (de)
				
				byteStream.push(26);
				return 1;
			} else if(operand[1] == '(hli)') {
				
				byteStream.push(42);
				return 1;
			} else if(operand[1] == '(hld)') {
				
				byteStream.push(58);
				return 1;
			} else {
				// ld a, (mem16)
				
				byteStream.push(250);
				readWord([operand[1].slice(1, -1).trim()]);
				return 3;
			}
			
		} else {
			// Assume an immediate load.
			byteStream.push(6 + target * 8);
			readByte([operand[1]]);
			
			return 2;
		}
		
	} else if(operand[1] == 'a') {
		// Memory load from a
		if(operand[0] == '(bc)') {
			
			byteStream.push(2);
			return 1;
		} else if(operand[0] == '(de)') {
			
			byteStream.push(18);
			return 1;
		} else if(operand[0] == '(hli)') {
			
			byteStream.push(34);
			return 1;
		} else if(operand[0] =='(hld)') {
			
			byteStream.push(50);
			return 1;
		} else {
			// ld (mem16), a
			
			byteStream.push(234);
			readWord([operand[0].slice(1, -1).trim()]);
			return 3;
		}
	} else if(operand[0] == 'bc') {
		// ld bc, imm16
		
		byteStream.push(1);
		readWord([operand[1]]);
		return 3;
	} else if(operand[0] == 'de') {
		// ld de, imm16
		
		byteStream.push(17);
		readWord([operand[1]]);
		return 3;
	} else if(operand[0] == 'hl') {
		if(operand[1].match(/^\(\s*sp\s*\+(-?\s*(?:\d+)|((?:\$|hex::?|0x)?(?:[0-9A-Fa-f]+)(?:h|H)?)|((?:%|bin::?|0b)?(?:[01]+)(?:b|B)?))\s*\)$/)) {
			// ld hl, [sp+imm8]
			
			byteStream.push(248);
			readByte([RegExp.$1]);
			return 2;
		} else {
			// ld hl, imm16
			byteStream.push(33);
			readWord([operand[1]]);
			return 3;
		}
	} else if(operand[0] == 'sp') {
		if(operand[1] == 'hl') {
			byteStream.push(249);
			return 1;
		} else {
			byteStream.push(49);
			readWord(operand[1]);
			return 3;
		}
	} else {
		throw new AsmError('Opérandes inconnues pour ld !');
	}
}

function determineLdiType(operand) {
	if(operand.length != 2) {
		throw new AsmError('ldi prend exactement deux opérandes !');
	}
	
	if(operand[0] == 'a' && operand[1] == '(hl)') {
		byteStream.push(42);
	} else if(operand[0] == '(hl)' && operand[1] == 'a') {
		byteStream.push(34);
	} else {
		throw new AsmError('Utilisation de ldi invalide ! "ldi (hl), a" or "ldi a, (hl)" sont valides.');
	}
	
	return 1;
}

function determineLddType(operand) {
	if(operand.length != 2) {
		throw new AsmError('ldd prend exactement deux opérandes !');
	}
	
	if(operand[0] == 'a' && operand[1] == '(hl)') {
		byteStream.push(58);
	} else if(operand[0] == '(hl)' && operand[1] == 'a') {
		byteStream.push(50);
	} else {
		throw new AsmError('Utilisation de ldd invalide ! "ldd (hl), a" or "ldd a, (hl)" sont valides.');
	}
	
	return 1;
}

function determineLdhType(operand) {
	if(operand.length != 2) {
		throw new AsmError('ldh prend exactement deux opérandes !');
	}
	
	if(operand[0] != 'a' && operand[1] != 'a') {
		throw new AsmError('Une des deux opérandes de ldh doit être a !');
	}
	
	var isLoadFromMem = operand[0] == 'a';
	var memAccess = operand[0 + isLoadFromMem].trim();
	if(memAccess.match(/^\(((\$|hex::?|0x)?[fF]{2}00(h|H)?\s+\+\s+)?c\)$/) || memAccess == '(c)') {
		if(isLoadFromMem) {
			throw new AsmError('Opérande de ldh invalide !');
		}
		
		// ldh ($FF00 + c), a
		byteStream.push(226);
		return 1;
	} else if(memAccess.match(/^\((?:\$|hex::?|0x)(?:[fF]{2}(?:00\s+\+\s+(?:\$|hex::?|0x)?)?)?([0-9A-Fa-f]{2})\)$/)) {
		byteStream.push(224 + isLoadFromMem * 16);
		readByte(['$' + RegExp.$1]);
		return 2;
	} else {
		throw new AsmError('Opérande de ldh invalide : ' + memAccess);
	}
}

function determineAddType(operand) {
	if(operand.length != 2) {
		try {
			// Try to read a "add imm8", and but throw an operand error if it fails
			if(operand.length != 1) {
				// Error message doesn't matter : it will be caught.
				throw new AsmError('J\'AIME LA COUCROUTE. OH MON DIEU UNE FAUTE DE FRAPE.');
			}
			
			byteStream.push(198);
			readByte(operand);
			return 2;
			
		} catch(err) {
			throw new AsmError('add prend exactement deux opérandes !');
		}
	}
	
	var reg2;
	if(operand[0] == 'hl') {
		reg2 = reg16.indexOf(operand[1]);
		if(reg2 == -1) {
			throw new AsmError('add hl, reg16 attend un registre 16-bit comme seconde opérande, mais ' + operand[1] + ' a été obtenu.');
		}
		
		byteStream.push(reg2 * 16 + 9);
		return 1;
		
	} else if(operand[0] == 'a') {
		reg2 = reg8.indexOf(operand[1]);
		if(reg2 == -1) {
			// Immediate add
			byteStream.push(198);
			readByte(operand.slice(1));
			return 2;
		}
		
		byteStream.push(128 + reg2);
		return 1;
	} else {
		throw new AsmError('La première opérende à add est soit a soit hl !');
	}
}

function determineAdcType(operand) {
	var source;
	
	if(operand.length != 1) {
		if(operand.length != 2) {
			throw new AsmError('adc prend exactement deux opérandes !');
		} else if(operand[0] != 'a') {
			throw new AsmError('La première opérande à adc doit être a !');
		}
		source = operand[1];
	} else {
		source = operand[0];
	}
	
	var sourceID = reg8.indexOf(source);
	if(sourceID != -1) {
		byteStream.push(136 + sourceID);
		return 1;
	} else {
		byteStream.push(206);
		readByte([source]);
		return 2;
	}
}

function determineSubType(operand) {
	var source;
	
	if(operand.length != 1) {
		if(operand.length != 2) {
			throw new AsmError('sub prend exactement deux opérandes !');
		} else if(operand[0] != 'a') {
			throw new AsmError('La première opérande à sub doit être a !');
		}
		source = operand[1];
	} else {
		source = operand[0];
	}
	
	var sourceID = reg8.indexOf(source);
	if(sourceID != -1) {
		byteStream.push(144 + sourceID);
		return 1;
	} else {
		byteStream.push(214);
		readByte([source]);
		return 2;
	}
}

function determineSbcType(operand) {
	var source;
	
	if(operand.length != 1) {
		if(operand.length != 2) {
			throw new AsmError('sbc prend exactement deux opérandes !');
		} else if(operand[0] != 'a') {
			throw new AsmError('La première opérande à sbc doit être a !');
		}
		source = operand[1];
	} else {
		source = operand[0];
	}
	
	var sourceID = reg8.indexOf(source);
	if(sourceID != -1) {
		byteStream.push(152 + sourceID);
		return 1;
	} else {
		byteStream.push(222);
		readByte([operand[1]]);
		return 2;
	}
}

function determineIncType(operand) {
	if(operand.length != 1) {
		throw new AsmError('inc prend exactement une opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg != -1) {
		byteStream.push(4 + reg * 8);
		return 1;
	}
	
	reg = reg16.indexOf(operand[0]);
	if(reg != -1) {
		byteStream.push(3 + reg * 16);
		return 1;
	}
	
	if(operand[0] == 'sp') {
		byteStream.push(51);
		return 1;
	} else {
		throw new AsmError('L\'opérande à inc doit être un reg8, reg16 ou sp, mais \'' + operand + '\' a été obtenu.')
	}
}

function determineDecType(operand) {
	if(operand.length != 1) {
		throw new AsmError('dec prend exactement une opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg != -1) {
		byteStream.push(5 + reg * 8);
		return 1;
	}
	
	reg = reg16.indexOf(operand[0]);
	if(reg != -1) {
		byteStream.push(11 + reg * 16);
		return 1;
	}
	
	if(operand[0] == 'sp') {
		byteStream.push(59);
		return 1;
	} else {
		throw new AsmError('L\'opérande à dec doit être un reg8, reg16 or sp, mais \'' + operand + '\' a été obtenu.')
	}
}

function determineAndType(operand) {
	determineSubType(operand);
	byteStream[byteStream.length - 1] += 16;
}

function determineOrType(operand) {
	determineSubType(operand);
	byteStream[byteStream.length - 1] += 32;
}

function determineXorType(operand) {
	determineSubType(operand);
	byteStream[byteStream.length - 1] += 24;
}

function determineCpType(operand) {
	determineSubType(operand);
	byteStream[byteStream.length - 1] += 40;
}

function determineJrTypeAndDest(operand) {
	if(operand.length == 1) {
		operand.push(operand[0]);
		byteStream.push(24);
	} else if(operand.length == 2) {
		var cond = conds.indexOf(operand[0]);
		if(cond == -1) {
			throw new AsmError('Condition invalide à jr !');
		}
		
		byteStream.push(32 + cond * 8);
	} else {
		throw new AsmError('Opérandes invalides à jr ! ');
	}
	
	readWord([operand[1]]);
	var high = byteStream.pop(), low = byteStream.pop();
	if(typeof low == 'object') {
		low.size = 1;
		low.isLabel = true;
		byteStream.push(low);
	} else {
		
		var addr = high * 256 + low;
		var i = 0, uniqueName = 'jr:0';
		while(labels.indexOf(uniqueName) != -1) {
			i++;
			uniqueName = 'jr:' + i;
		}
		labels.push({name: uniqueName, offset: addr});
		byteStream.push({size: 1, name: uniqueName, isLabel: true});
	}

	return 2;
}

function determineJpTypeAndDest(operand) {
	if(operand.length == 1) {
		if(operand[0] == 'hl' || operand[0] == '(hl)') {
			// jp (hl)
			byteStream.push(233);
			return 1;
		}
		
		operand.push(operand[0]);
		byteStream.push(195);
	} else if(operand.length == 2) {
		var cond = conds.indexOf(operand[0]);
		if(cond == -1) {
			throw new AsmError('Condition invalide à jp !');
		}
		
		byteStream.push(194 + cond * 8);
	} else {
		throw new AsmError('Opérandes invalides à jp ! ');
	}
	
	readWord([operand[1]]);
	if(typeof byteStream[byteStream.length - 2] == 'object') {
		byteStream[byteStream.length - 2].isLabel = true;
	}
	return 3;
}

function determineCallTypeAndDest(operand) {
	if(operand.length == 1) {
		operand.push(operand[0]);
		byteStream.push(197);
	} else if(operand.length == 2) {
		var cond = conditionals.indexOf(operand[0]);
		if(cond == -1) {
			throw new AsmError('Condition invalide à call !');
		}
		
		byteStream.push(196 + cond * 8);
	} else {
		throw new AsmError('Opérandes invalides à call ! ');
	}
	
	if(typeof operand[1] == 'string') {
		byteStream.push(operand[1]);
		byteStream.push(0); // Filler for address replacement
	} else {
		byteStream.push(operand[1] % 256);
		byteStream.push(Math.floor(operand[1] / 256));
	}
	
	return 3;
}

function determineRetType(operand) {
	if(operand.length != 1) {
		throw new AsmError('ret n\'accepte qu\'une seule opérande !');
	}
	
	if(operand[0] == '') {
		byteStream.push(201);
	} else {
		var condOfs = conds.indexOf(operand[0]);
		if(condOfs == -1) {
			throw new AsmError('ret n\'accepte que les conditions suivantes : nz, z, nc, or c');
		}
		
		byteStream.push(192 + condOfs * 8);
	}
	return 1;
}

function determineRstDestination(operand) {
	if(operand.length != 1) {
		throw new AsmError('rst n\'accepte qu\'une seule opérande !');
	} else if(!operand[0].match(/^[0-3][08]h$/)) {
		throw new AsmError('L\'opérande de rst doit être 00h, 08h, 10h, 18h, 20h, 28h, 30h, ou 38h !');
	}
	
	byteStream.push(199 + parseHex(operand[0]));
	return 1;
}

function determinePushType(operand) {
	if(operand.length != 1) {
		throw new AsmError('push n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg16.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('push : opérande ' + operand[0] + ' invalide (bc, de, hl ou af attendus)');
	}
	
	byteStream.push(197 + reg * 16);
	return 1;
}

function determinePopType(operand) {
	if(operand.length != 1) {
		throw new AsmError('pop n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg16.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('pop : opérande ' + operand[0] + ' invalide (bc, de, hl ou af attendus)');
	}
	
	byteStream.push(193 + reg * 16);
	return 1;
}

function placeNop(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(0);
	return 1;
}

function placeScf(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('scf n\'accepte aucune opérande !');
	}
	
	byteStream.push(55);
	return 1;
}

function placeCcf(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('ccf n\'accepte aucune opérande !');
	}
	
	byteStream.push(63);
	return 1;
}

function placeCpl(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('cpl n\'accepte aucune opérande !');
	}
	
	byteStream.push(47);
	return 1;
}

function placeDaa(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('daa n\'accepte aucune opérande !');
	}
	
	byteStream.push(39);
	return 1;
}

function placeRla(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('rla n\'accepte aucune opérande !');
	}
	
	byteStream.push(23);
	return 1;
}

function placeRra(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('rra n\'accepte aucune opérande !');
	}
	
	byteStream.push(31);
	return 1;
}

function placeRlca(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('rlca n\'accepte aucune opérande !');
	}
	
	byteStream.push(7);
	return 1;
}

function placeRrca(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('rrca n\'accepte aucune opérande !');
	}
	
	byteStream.push(15);
	return 1;
}

function determineRlcType(operand) {
	if(operand.length != 1) {
		throw new AsmError('rlc n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande de rlc doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(reg8);
	return 2;
}

function determineRrcType(operand) {
	if(operand.length != 1) {
		throw new AsmError('rrc n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à rrc doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(8 + reg8);
	return 2;
}

function determineRlType(operand) {
	if(operand.length != 1) {
		throw new AsmError('rl n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à rl doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(16 + reg8);
	return 2;
}

function determineRrType(operand) {
	if(operand.length != 1) {
		throw new AsmError('rr n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à rr doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(24 + reg8);
	return 2;
}

function determineSlaType(operand) {
	if(operand.length != 1) {
		throw new AsmError('sla n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à sla doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(32 + reg8);
	return 2;
}

function determineSraType(operand) {
	if(operand.length != 1) {
		throw new AsmError('sra n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à sra doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(40 + reg8);
	return 2;
}

function determineSwapType(operand) {
	if(operand.length != 1) {
		throw new AsmError('swap n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à swap doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(48 + reg8);
	return 2;
}

function determineSrlType(operand) {
	if(operand.length != 1) {
		throw new AsmError('srl n\'accepte qu\'une seule opérande !');
	}
	
	var reg = reg8.indexOf(operand[0]);
	if(reg == -1) {
		throw new AsmError('L\'opérande à srl doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(56 + reg8);
	return 2;
}

function determineBitType(operand) {
	if(operand.length != 2) {
		throw new AsmError('bit prend exactement deux opérandes !');
	}
	
	var bit = parseInt(operand[0]);
	if(isNaN(bit) || bit < 0 || bit > 7) {
		throw new AsmError('La première opérande à bit doit etre un entier entre 0 et 7 (inclusif) !');
	}
	
	var reg = reg8.indexOf(operand[1]);
	if(reg == -1) {
		throw new AsmError('La seconde opérande à bit doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(64 + bit * 8 + reg);
	return 2;
}

function determineResType(operand) {
	if(operand.length != 2) {
		throw new AsmError('res prend exactement deux opérandes !');
	}
	
	var bit = parseInt(operand[0]);
	if(isNaN(bit) || bit < 0 || bit > 7) {
		throw new AsmError('La première opérande à res doit etre un entier entre 0 et 7 (inclusif) !');
	}
	
	var reg = reg8.indexOf(operand[1]);
	if(reg == -1) {
		throw new AsmError('La seconde opérande à res doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(128 + bit * 8 + reg);
	return 2;
}

function determineSetType(operand) {
	if(operand.length != 2) {
		throw new AsmError('set prend exactement deux opérandes !');
	}
	
	var bit = parseInt(operand[0]);
	if(isNaN(bit) || bit < 0 || bit > 7) {
		throw new AsmError('La première opérande à set doit etre un entier entre 0 et 7 (inclusif) !');
	}
	
	var reg = reg8.indexOf(operand[1]);
	if(reg == -1) {
		throw new AsmError('La seconde opérande à set doit être un reg8 !');
	}
	
	byteStream.push(203);
	byteStream.push(196 + bit * 8 + reg);
	return 2;
}

function placeHalt(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(118);
	return 1;
}

function placeStop(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(16);
	byteStream.push(0);
	return 2;
}

function placeEi(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(251);
	return 1;
}

function placeDi(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(243);
	return 1;
}

function placeReti(operand) {
	if(operand.length != 1 || operand[0] != '') {
		throw new AsmError('nop n\'accepte aucune opérande !');
	}
	
	byteStream.push(217);
	return 1;
}

var instructions = [{name: 'db', func: readByte}, {name: 'dw', func: readWord},
					{name: 'ld', func: determineLdType}, {name: 'ldi', func: determineLdiType}, {name: 'ldd', func: determineLddType}, {name: 'ldh', func: determineLdhType},
					{name: 'add', func: determineAddType}, {name: 'adc', func: determineAdcType}, {name: 'sub', func: determineSubType}, {name: 'sbc', func: determineSbcType},
					{name: 'inc', func: determineIncType}, {name: 'dec', func: determineDecType},
					{name: 'and', func: determineAndType}, {name: 'or', func: determineOrType}, {name: 'xor', func: determineXorType}, {name: 'cp', func: determineCpType},
					{name: 'jr', func: determineJrTypeAndDest}, {name: 'jp', func: determineJpTypeAndDest},
					{name: 'call', func: determineCallTypeAndDest}, {name: 'ret', func: determineRetType}, {name: 'rst', func: determineRstDestination},
					{name: 'push', func: determinePushType}, {name: 'pop', func: determinePopType},
					{name: 'nop', func: placeNop},
					{name: 'scf', func: placeScf}, {name: 'ccf', func: placeCcf}, {name: 'cpl', func: placeCpl}, {name: 'daa', func: placeDaa},
					{name: 'rla', func: placeRla}, {name: 'rra', func: placeRra}, {name: 'rlca', func: placeRlca}, {name: 'rrca', func: placeRrca},
					{name: 'rlc', func: determineRlcType}, {name: 'rrc', func: determineRrcType}, {name: 'rl', func: determineRlType}, {name: 'rr', func: determineRrType},
						{name: 'swap', func: determineSwapType}, {name: 'srl', func: determineSrlType}, {name: 'sla', func: determineSlaType}, {name: 'sra', func: determineSraType},
					{name: 'bit', func: determineBitType}, {name: 'res', func: determineResType}, {name: 'set', func: determineSetType},
					{name: 'halt', func: placeHalt}, {name: 'stop', func: placeStop},
					{name: 'ei', func: placeEi}, {name: 'di', func: placeDi},
					{name: 'reti', func: placeReti}];

var items = [
		'FLASH', // Liste des items. M'a fallu une semaine ! ><
        'Master Ball',
        'Hyper Ball',
        'Super Ball',
        'Pok&eacute; Ball',
        'Carte',
        'Bicyclette',
        '????? ("Planche de Surf")',
        'Safari Ball',
        'Pok&eacute;dex',
        'Pierre Lune',
        'Antidote',
        'Anti-br&ucirc;le',
        'Anti-Gel',
        'R&eacute;veil',
        'Anti-Para',
        'Gu&eacute;rison',
        'Potion Max',
        'Hyper Potion',
        'Super Potion',
        'Potion',
        'Badge Roche',
        'Badge Cascade',
        'Badge Foudre',
        'Badge Prisme',
        'Badge &Acirc;me',
        'Badge Marais',
        'Badge Volcan',
        'Badge Terre',
        'Corde Sortie',
        'Repousse',
        'Vieil Ambre',
        'Pierre Feu',
        'PierreFoudre',
        'Pierre Eau',
        'PV Plus',
        'Prot&eacute;ine',
        'Fer',
        'Carbone',
        'Calcium',
        'Super Bonbon',
        'Fossile D&ocirc;me',
        'Nautile',
        'Cl&eacute; scr&egrave;te',
        '????? (Inutilisable)',
        'Bon Commande',
        'Pr&eacute;cision +',
        'PierrePlante',
        'Carte Magn.',
        'P&eacute;pite',
        'PP Plus (inutilisable)',
        'Pok&eacute;poup&eacute;e',
        'Total Soin',
        'Rappel',
        'Rappel Max',
        'D&eacute;fense Spec.',
        'SuperRepousse',
        'Max Repousse',
        'Muscle +',
        'Jetons',
        'Eau Fra&icirc;che',
        'Soda Cool',
        'Limonade',
        'Passe Bateau',
        'Dent d\'or',
        'Attaque +',
        'D&eacute;fense +',
        'Vitesse +',
        'Sp&eacute;cial +',
        'Bo&icirc;te Jeton',
        'Colis Chen',
        'Cherc\'Objet',
        'Scope Sylph',
        'Pok&eacute;flute',
        'Cl&eacute; Asc.',
        'Multi Exp.',
        'Canne',
        'Super Canne',
        'M&eacute;ga Canne',
        'PP Plus (valide)',
        'Huile',
        'Huile Max',
        '&Eacute;lixir',
        'Max &eacute;lixir',
        '2&egrave;me SS',
        '1er SS',
        'RDC',
        '1er &eacute;tage',
        '2&egrave;me &eacute;tage',
        '3&egrave;me &eacute;tage',
        '4&egrave;me &eacute;tage',
        '5&egrave;me &eacute;tage',
        '6&egrave;me &eacute;tage',
        '7&egrave;me &eacute;tage',
        '8&egrave;me &eacute;tage',
        '9&egrave;me &eacute;tage',
        '10&egrave;me &eacute;tage',
        '4&egrave;me SS',
        'w&uuml;m\'||lm||',
        'ws*l\'||lm||',
        'v Aft||lm||',
        '&ucirc;c\' &egrave;||lm||',
        ' &ecirc;u\'c\'m\'||lm||',
        '&uuml;wj\'&eacute;||lm||',
        '||lf||lm||',
        '&ecirc;&ocirc;A ||lm||',
        '\\-g*||lm||',
        'A /',
        '&ecirc;j\'&agrave;',
        '*i l *',
        'Lg|||-',
        '\\-g*',
        '?QGn?Sl',
        'Gn?Sl',
        '?Q;MP-',
        ';MP-',
        'DHNh | T4',
        '*&ouml;****j\'*',
        '_/*-',
        '4',
        '*4&ocirc; &ecirc;*&uuml;?',
        '*8\\&ucirc;',
        '8*&ucirc;-',
        '4&ucirc; hA *',
        '89*****l\'&ecirc;Gp*|||',
        'BOULET* *A***** *&ocirc;p**',
        'BOULET********',
        '......* *||| ** ; *',
        '*',
        '**ASPICOT/',
        '4/&icirc;*4\\&icirc;y&uuml;. ... ...4*',
        '4*&icirc;*',
        'K*** ... ...*p*|||&icirc; a',
        'ECHANGE TERMINE !',
        'Dommage ! L\'&eacute;change',
        '&uacute;',
        '| eBOULET* \'*||*',
        '****pkmn***&ouml;***ASPICOT&ouml;',
        '*SG*',
        '*HG*',
        '**l\'&ecirc;o qB** ......*',
        'CENTRE TROC',
        'p\' &agrave;**&ouml;/\\* |||*METAMORPH',
        '*a&auml;/*** |||**&ouml;/',
        '8 \\',
        'ANIMATION COMBAT',
        'STYLE COMBAT',
        'RETOUR',
        '*?B4*',
        '\\*/*2p*',
        '\'*',
        '**H***pkmnH*',
        '*+H*',
        '**I*',
        '**I*',
        '* D//*\'*** ......*',
        '8',
        'APOK&eacute;DRES. * : *',
        '** p* ***C ?',
        '8',
        '\\**&agrave; ** ',
        '*',
        'p** ***Q *I3*4* h',
        '**',
        '*Q n &ocirc;4* h&acirc; ov**',
        '&ocirc;4*&icirc;8/&acirc;4*&icirc;8*&ucirc;pH*****',
        'ABCDEFHIJKLMNOPQRST',
        'ov*** * &auml;***&ouml;** a*',
        '(nom du joueur)||* ?&auml;4C 8*********',
        '*',
        '&acirc; **2*u&auml;4C *c\'vh***y\'v',
        'NOM DU RIVAL ?',
        'NOM ?',
        'SURNOM ?',
        'ps*?L \\L4/&icirc;h\\**KL *',
        '8',
        '\? *||| , ****/**D**s&auml;',
        'ps*ASPICOTL \\L4/&icirc;h\\***L *',
        '8',
        '\* *||| ,**',
        'd\'*a&auml;*** &ouml;|||** ......* * : *',
        'NOM:',
        'NOM:',
        '**',
        '*5*z\\**|||.CL*:',
        'BLUE pour Rouge, RED pour Bleu',
        'REGIS',
        'JEAN',
        'NOM :',
        'RED pour Rouge, BLUE pour Bleu',
        'SACHA',
        'PAUL',
        '',
        '*',
        '*||M\\',
        '**M\\',
		"CS01",
		"CS02",
		"CS03",
		"CS04",
		"CS05",
		"CT01",
		"CT02",
		"CT03",
		"CT04",
		"CT05",
		"CT06",
		"CT07",
		"CT08",
		"CT09",
		"CT10",
		"CT11",
		"CT12",
		"CT13",
		"CT14",
		"CT15",
		"CT16",
		"CT17",
		"CT18",
		"CT19",
		"CT20",
		"CT21",
		"CT22",
		"CT23",
		"CT24",
		"CT25",
		"CT26",
		"CT27",
		"CT28",
		"CT29",
		"CT30",
		"CT31",
		"CT32",
		"CT33",
		"CT34",
		"CT35",
		"CT36",
		"CT37",
		"CT38",
		"CT39",
		"CT40",
		"CT41",
		"CT42",
		"CT43",
		"CT44",
		"CT45",
		"CT46",
		"CT47",
		"CT48",
		"CT49",
		"CT50",
		"CT51",
		"CT52",
		"CT53",
		"CT54",
		"CANCEL"];
var attribs = [
        {used: false, valid: false, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: true},
        {used: false, valid: false, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty:true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: false, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: false},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: true, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: false, qty: true},
        {used: false, valid: false, qty: false}];
function compile(evt) {
	// Prevent submitting the form (would trigger a page reload or scroll)
	evt.preventDefault();
	
	// Removes the line labels
	$('#dismissError').trigger('click');
	
	// Get all code lines
	var codeElem = document.getElementById('code'),
		lines = codeElem.innerText.split('\n'),
		lastElem = lines.pop();
	
	// Sometimes there is a trailing <br /> that doesn't generate any newline on-screen.
	// If causes a problem with line numbering, though.
	if(lastElem != '') {
		lines.push(lastElem);
	}
	
	codeElem.innerHTML = lines.join('<br />');
	// Declare variables
	var n = lines.length, i, lineNums = [];
	
	for(i = 1; i <= n; i++) {
		lineNums.push('' + i);
	}
	$('#lineNumbers').html(lineNums.join('<br/>')).removeClass('hidden').attr('aria-hidden', 'false');
	
	labels = [];
	currentGlobalLabel = '';
	function getLabelOffset(labelName) {
		var labelOffset = -1;
		labels.forEach(function(label) {
			if(label.name == b) {
				labelOffset = label;
			}
		});
		
		if(labelOffset == -1) {
			throw new AsmError('Ligne ' + i + ' : Label inconnu \'' + b + '\'');
		}
		return labelOffset;
	}
	
	try {
		var offset = hexToDec($('#baseOffset').val().toLowerCase());
	} catch(err) {
		throw new AsmError('Impossible de reconnaître l\'adresse de départ : ' + err.message);
	}
	var baseOffset = offset;
	
	
	/** BEGIN ASSEMBLER **/
	
	// Flush the byte stream
	byteStream = [];
	
	for(i = 0; i < n; ) {
		lines[i].search(/\[(.+)\]/);
		var pieces = lines[i].toLowerCase()
							 .replace('[', '(').replace(']', ')') // Braces will be parsed the same as parentheses. Note that "ld [hl), 1" becomes valid...whatever.
							 .trim() // Trim to make sure the first character is wordy
							 .split(';')[0] // Get the part before the comment,
							 .split(/\s+/); // And split each part, allowing each to be separated by any "white" characters
		var instrName = pieces[0]; // Get the instruction name
		var operands = pieces.slice(1).join('').split(','); // Get the operand part
		
		i++;
		
		if(instrName != '') { // If the line contains nothing, don't process it
			
			if(instrName[0] == '.') {
				// Local label
				// Name will be in format "Global.Local"
				instrName = instrName.trim();
				if(instrName.slice(1) == '') {
					throw new AsmError('Ligne ' + i + ' : Empty label name !');
				}
				
				if(labels.indexOf(currentGlobalLabel + instrName) != -1) {
					throw new AsmError('Ligne ' + i + ' : Label ' + currentGlobalLabel + instrName + ' en double !');
				}
				labels.push({name: currentGlobalLabel + instrName, offset: offset});
				
			} else if(instrName.indexOf(':') != -1) {
				// Global label
				instrName = instrName.replace(':', '').replace(':', '').trim();
				if(instrName == '') {
					throw new AsmError('Ligne ' + i + ' : Nom de label vide !');
				}
				
				if(labels.indexOf(instrName) != -1) {
					throw new AsmError('Ligne ' + i + ' : Label ' + instrName + ' en double !');
				}
				labels.push({name: instrName, offset: offset});
				currentGlobalLabel = instrName;
				
			} else {
				// Instruction
				var ranFunc = false;
				instructions.forEach(function(instruction) {
					if(instruction.name == instrName) {
						// The function return how many bytes were written.
						try {
							var len = instruction.func(operands);
							offset += len;
							
							// Add the current line number to all added objects
							for(var index = 1; index <= len; index++) {
								if(typeof byteStream[byteStream.length - index] == 'object') {
									byteStream[byteStream.length - index].line = i;
								}
							}
						} catch(err) {
							err.message = 'Ligne ' + i + ' : ' + err.message;
							throw err;
						}
						ranFunc = true;
					}
				});
				
				if(!ranFunc) {
					throw new AsmError('Ligne ' + i + ' : Instruction inconnue : ' + instrName + ' (ligne ' + i + ')');
				}
			}
		}
		
		if(offset >= 65536) {
			throw new AsmError('Ligne ' + i + ' : Vous êtes au-delà de l\'adresse $FFFF !');
		}
	}
	
	/** END ASSEMBLER **/
	
	/** BEGIN COMPILER **/
	
	n = byteStream.length;
	offset = baseOffset;
	var itemList = [];
	var warnings = {duplicate: false, quantity: false, invalid: false};
	
	function processByteStreamElem(i) {
		var b = byteStream[i];
		
		switch(typeof b) {
			case 'number':
				// Leave untouched.
			break;
			
			case 'object':
				// Replace the label with its data, according to the accompanying size attribute.
				var addr = -1;
				labels.forEach(function(label) {
					if(label.name == b.name) {
						addr = label.offset;
					}
				});
				if(addr == -1) {
					if(b.label) {
						console.table(labels);
						throw new AsmError('Ligne ' + b.line + ' : Label ' + b.name + ' inconnu !');
					} else {
						throw new AsmError('Ligne ' + b.line + ' : Opérande invalide : ' + b.name);
					}
				}
				
				// 8-bit will calculate (jr) offset, 16-bit will calculate the address.
				if(b.size == 2) {
					// 16-bit
					b = addr % 256;
					byteStream[i+1] = Math.floor(addr / 256);
				} else {
					// 8-bit
					b = addr - (offset + 2);
					if(b < -128 || b > 127) {
						throw new AsmError('Ligne ' + b.line + ' : Impossible de jr de $' + offset + ' à ' + byteStream[i]);
					}
					
					// Signed to unsigned
					if(b < 0) {
						b += 256;
					}
				}
				
				byteStream[i] = b;
			break;
			
			default:
				console.table(byteStream);
				throw new AsmError('Élément du byteStream inconnu à l\'index ' + i);
		}
	}
	
	for(i = 0; i < n; i++) {
		processByteStreamElem(i);
		var b = byteStream[i];
		
		// We now process the thing.
		if(attribs[b].used) {
			warnings.duplicate = true;
		} else {
			attribs[b].used = true;
		}
		if(!attribs[b].qty && i+1 != byteStream.length && byteStream[i+1] != 1) {
			warnings.quantity = true;
		}
		if(!attribs[b].valid) {
			warnings.invalid = true;
		}
		var line = items[b];
		if(!attribs[b].valid) {
			line += ' (hex:' + decToHex(b).toUpperCase() + ')';
		}
		
		line += '</div><div class="col-sm-5">';
		
		i++;
		if(i == byteStream.length) {
			line += 'x[Qté quelconque]';
		} else {
			processByteStreamElem(i);
			line += 'x' + byteStream[i] + ' (hex:' + decToHex(byteStream[i]).toUpperCase() + ')';
		}
		
		itemList.push(line);
		
		offset++;
	}
	
	/** END COMPILER **/
	
	var output = itemList.join('</div><div class="col-sm-7">');
	$('#output').html('<div class="col-sm-7">' + (output == '' ? 'Merci d\'écrire quelque chose à gauche.' : output) + '</div>');
}


// Is ran once the DOM has loaded
$(function() {
	// Set the code area to be editable
	$('#code').attr('contentEditable', 'true'); // .html('&nbsp;');
	
	$('#dismissError').click(function() {
		$('#errorPanel, #lineNumbers').addClass('hidden').attr('aria-hidden', 'true');
	});
	
	$('#code').focus(function() {
		$('#lineNumbers').addClass('hidden').attr('aria-hidden', 'true');
	});
	
	$('.form-inline').on('submit', function(evt) {
		$('#app').attr('aria-busy', 'true');
		
		try {
			compile(evt);
		} catch(err) {
			if(err.name == 'AsmError') { // Compilation error, nothing too bad
				$('#errorTitle').html('Erreur !');
				$('#errorText').html(err.message);
			} else { // Bad internal error
				$('#errorTitle').html('Erreur interne (' + err.name + ') !');
				$('#errorText').html(err.message + ' (ligne ' + err.lineNumber + ')'
										+ '<br />Stack trace :<br/>' + err.stack.split('\n').join('<br />')
										+ '<br /><br />Merci de copier ceci et le code que vous tentez de compiler et de l\'envoyer au développeur. Merci !');
			}
			$('#errorPanel').removeClass('hidden').attr('aria-hidden', 'false');
			throw err;
		} finally {
			$('#app').attr('aria-busy', 'false');
		}
	});
	
	// Otherwise the <p> is a bit small and tedious to get focus on.
	$('.panel-body').click(function() {
		document.getElementById('code').focus();
	});
});
