function readDecoderByte(decoder) {
	var byte = decoder.bytes[decoder.i]
	++decoder.i
	return byte
}

function getDataRegister(registerNumber, depth) {
	switch(depth) {
		case 8: {
			switch(registerNumber) {
				case 0: return 'AL'
				case 1: return 'CL'
				case 2: return 'DL'
				case 3: return 'BL'
				case 4: return 'AH'
				case 5: return 'CH'
				case 6: return 'DH'
				case 7: return 'BH'
			}
		}

		case 16: {
			switch(registerNumber) {
				case 0: return 'AX'
				case 1: return 'CX'
				case 2: return 'DX'
				case 3: return 'BX'
				case 4: return 'SP'
				case 5: return 'BP'
				case 6: return 'SI'
				case 7: return 'DI'
			}
		}

		case 32: {
			switch(registerNumber) {
				case 0: return 'EAX'
				case 1: return 'ECX'
				case 2: return 'EDX'
				case 3: return 'EBX'
				case 4: return 'ESP'
				case 5: return 'EBP'
				case 6: return 'ESI'
				case 7: return 'EDI'
			}
		}
	}
}

function getSegmentRegister(registerNumber) {
	switch(registerNumber) {
		case 0: return 'ES'
		case 1: return 'CS'
		case 2: return 'SS'
		case 3: return 'DS'
		case 4: return 'FS'
		case 5: return 'GS'
	}
}

function getMemory16Command(decoder, config, depth) {
	var mod = (config >> 6) & 0b00000011
	var opcode = config & 0b00000111
	var offset

	switch(mod) {
		case 0: {
			switch(opcode) {
				case 0: return `[BX + SI]`
				case 1: return `[BX + DI]`
				case 2: return `[BP + SI]`
				case 3: return `[BP + DI]`
				case 4: return `[SI]`
				case 5: return `[DI]`
				case 6: {
					offset = readDecoderByte(decoder)
					return `[${offset}]`
				}
				case 7: return `[BX]`
			}
		}

		case 1: {
			offset = readDecoderByte(decoder)

			switch(opcode) {
				case 0: return `[BX + SI + ${offset}]`
				case 1: return `[BX + DI + ${offset}]`
				case 2: return `[BP + SI + ${offset}]`
				case 3: return `[BP + DI + ${offset}]`
				case 4: return `[SI + ${offset}]`
				case 5: return `[DI + ${offset}]`
				case 6: return `[BP + ${offset}]`
				case 7: return `[BX + ${offset}]`
			}
		}

		case 2: {
			offset = readDecoderByte(decoder)
			offset += readDecoderByte(decoder) << 8

			switch(opcode) {
				case 0: return `[BX + SI + ${offset}]`
				case 1: return `[BX + DI + ${offset}]`
				case 2: return `[BP + SI + ${offset}]`
				case 3: return `[BP + DI + ${offset}]`
				case 4: return `[SI + ${offset}]`
				case 5: return `[DI + ${offset}]`
				case 6: return `[BP + ${offset}]`
				case 7: return `[BX + ${offset}]`
			}
		}

		case 3: {
			return getDataRegister(opcode, depth)
		}
	}
}

function disassembleBinaryOperation1(decoder, operandIndex) {
	var memory16Command
	var byte
	var offset

	if(operandIndex < 4) {
		byte = readDecoderByte(decoder)

		var registerNumber = (byte >> 3) & 0b00000111

		switch(operandIndex) {
			case 0: return `${getMemory16Command(decoder, byte, 8)}, ${getDataRegister(registerNumber, 8)}`
			case 1: return `${getMemory16Command(decoder, byte, 16)}, ${getDataRegister(registerNumber, 16)}`
			case 2: return `${getDataRegister(registerNumber, 8)}, ${getMemory16Command(decoder, byte, 8)}`
			case 3: return `${getDataRegister(registerNumber, 16)}, ${getMemory16Command(decoder, byte, 16)}`
		}
	}
	else if(operandIndex == 4) {
		offset = readDecoderByte(decoder)
		return `AL, ${offset}`
	}
	else if(operandIndex == 5) {
		offset = readDecoderByte(decoder)
		offset += readDecoderByte(decoder) << 8
		return `AX, ${offset}`
	}
	else if(operandIndex == 6) {
		byte = readDecoderByte(decoder)
		memory16Command = getMemory16Command(decoder, byte, 8)
		offset = readDecoderByte(decoder)
		return `${memory16Command}, ${offset}`
	}
	else if(operandIndex == 7) {
		byte = readDecoderByte(decoder)
		memory16Command = getMemory16Command(decoder, byte, 16)
		offset = readDecoderByte(decoder)
		offset += readDecoderByte(decoder) << 8
		return `${memory16Command}, ${offset}`
	}
	else if(operandIndex == 8) {
		byte = readDecoderByte(decoder)
		return `${getMemory16Command(decoder, byte, 16)}, ${getSegmentRegister((byte >> 3) & 0b00000111)}`
	}
	else if(operandIndex == 9) {
		byte = readDecoderByte(decoder)
		return `${getSegmentRegister((byte >> 3) & 0b00000111)}, ${getMemory16Command(decoder, byte, 16)}`
	}
}

function decodeX86instruction(decoder) {
	var byte = readDecoderByte(decoder)
	
	if(byte >= 0x00 && byte <= 0x05) {
		return `add ${disassembleBinaryOperation1(decoder, byte)}`
	}
	else if(byte >= 0x08 && byte <= 0x0D) {
		return `or ${disassembleBinaryOperation1(decoder, byte - 0x08)}`
	}
	else if(byte >= 0x10 && byte <= 0x15) {
		return `adc ${disassembleBinaryOperation1(decoder, byte - 0x10)}`
	}
	else if(byte >= 0x18 && byte <= 0x1D) {
		return `sbb ${disassembleBinaryOperation1(decoder, byte - 0x18)}`
	}
	else if(byte >= 0x20 && byte <= 0x25) {
		return `and ${disassembleBinaryOperation1(decoder, byte - 0x20)}`
	}
	else if(byte >= 0x28 && byte <= 0x2D) {
		return `sub ${disassembleBinaryOperation1(decoder, byte - 0x28)}`
	}
	else if(byte >= 0x30 && byte <= 0x35) {
		return `xor ${disassembleBinaryOperation1(decoder, byte - 0x30)}`
	}
	else if(byte >= 0x38 && byte <= 0x3D) {
		return `cmp ${disassembleBinaryOperation1(decoder, byte - 0x38)}`
	}
	else if(byte >= 0x40 && byte <= 0x47) {
		return `inc ${getDataRegister(byte & 0b00000111, 16)}`
	}
	else if(byte >= 0x48 && byte <= 0x4F) {
		return `dec ${getDataRegister(byte & 0b00000111, 16)}`
	}
	else if(byte >= 0x50 && byte <= 0x57) {
		return `push ${getDataRegister(byte & 0b00000111, 16)}`
	}
	else if(byte >= 0x58 && byte <= 0x5F) {
		return `pop ${getDataRegister(byte & 0b00000111, 16)}`
	}
	else if(byte >= 0x70 && byte <= 0x7F) {
		var instructionName

		switch(byte) {
			case 0x70: instructionName = 'JO'; break
			case 0x71: instructionName = 'JNO'; break
			case 0x72: instructionName = 'JB'; break
			case 0x73: instructionName = 'JNB'; break
			case 0x74: instructionName = 'JZ'; break
			case 0x75: instructionName = 'JNZ'; break
			case 0x76: instructionName = 'JBE'; break
			case 0x77: instructionName = 'JA'; break
			case 0x78: instructionName = 'JS'; break
			case 0x79: instructionName = 'JNS'; break
			case 0x7A: instructionName = 'JP'; break
			case 0x7B: instructionName = 'JNP'; break
			case 0x7C: instructionName = 'JL'; break
			case 0x7D: instructionName = 'JNL'; break
			case 0x7E: instructionName = 'JLE'; break
			case 0x7F: instructionName = 'JNLE'; break
		}

		var offset = readDecoderByte(decoder)
		return `${instructionName} ${offset}`
	}
	else if(byte >= 0x80 && byte <= 0x83) {
		//...
	}
	else if(byte >= 0x90 && byte <= 0x97) {
		return `xchg AX, ${getDataRegister(byte & 0b00000111, 16)}`
	}
	else {
		switch(byte) {
			case 0x06: return `push ES`
			case 0x07: return `pop ES`
			case 0x0E: return `push CS`
			case 0x16: return `push SS`
			case 0x17: return `pop SS`
			case 0x1E: return `push DS`
			case 0x1F: return `pop DS`

			case 0x0F: return `unsupported two bytes operation`
			
			case 0x26: return `ES:`
			case 0x27: return `daa`
			case 0x2E: return `CS:`
			case 0x2F: return `das`
			case 0x36: return `SS:`
			case 0x37: return `aaa`
			case 0x3E: return `DS:`
			case 0x3F: return `aas`

			case 0x60: return `pusha`
			case 0x61: return `popa`

			//case 0x62: return `bound ${}` //bound reg mem 16
			//case 0x63: return `arpl ${}` //bound mem reg 16

			case 0x64: return `FS:`
			case 0x65: return `GS:`
			case 0x66: return `OPSIZE:`
			case 0x67: return `ADSIZE:`

			//case 0x68: return `push ${}`
		}
	}
}
/*
function decodeX86(bytes) {
	var disassembled = ''
	var decoder = {
		bytes: bytes,
		i: 0
	}
	
	while(decoder.i < decoder.bytes.length) {
		disassembled += decodeX86instruction(decoder) + '\n'
	}
	
	return disassembled
}*/

function decodeX86AndHighlight(parent, bytes, highlightByteIndex) {
	var decoder = {
		bytes: bytes,
		i: 0
	}
	
	while(decoder.i < decoder.bytes.length) {
		var disassembled = decodeX86instruction(decoder)
		var pre = document.createElement('pre')
		pre.appendChild(document.createTextNode(disassembled))
		
		if(highlightByteIndex >= 0 && decoder.i > highlightByteIndex) {
			pre.style.backgroundColor = '#AAF'
			highlightByteIndex = -1
		}
		
		parent.appendChild(pre)
	}
}