function getHexLetter(number) {
	switch(number) {
		case 0: return '0'
		case 1: return '1'
		case 2: return '2'
		case 3: return '3'
		case 4: return '4'
		case 5: return '5'
		case 6: return '6'
		case 7: return '7'
		case 8: return '8'
		case 9: return '9'
		case 10: return 'A'
		case 11: return 'B'
		case 12: return 'C'
		case 13: return 'D'
		case 14: return 'E'
		case 15: return 'F'
		default: return ''
	}
}

function byteToString(byte) {
	if(typeof byte != 'number') {
		return ''
	}

	var high = getHexLetter((byte / 16) | 0)
	var low = getHexLetter((byte % 16) | 0)

	return high + low
}

function numberToHexString(number) {
	return `${byteToString((number >> 8) & 0xff)}${byteToString((number) & 0xff)}`
}

function getHexNumber(char) {
	switch(char) {
		case '0': return 0
		case '1': return 1
		case '2': return 2
		case '3': return 3
		case '4': return 4
		case '5': return 5
		case '6': return 6
		case '7': return 7
		case '8': return 8
		case '9': return 9
		case 'A': return 10
		case 'B': return 11
		case 'C': return 12
		case 'D': return 13
		case 'E': return 14
		case 'F': return 15
		default: return 0
	}
}

function stringToByte(s) {
	s = s.toUpperCase()
	var high = s[0]
	var low = s[1]

	return getHexNumber(low) + getHexNumber(high) * 16
}


function createHexEditor(parent, bytes, onChange, onSelect) {
	var table = document.createElement('table')
	var headRow = document.createElement('tr')
	
	function addHeadColumn(name) {
		var column = document.createElement('td')
		column.appendChild(document.createTextNode(name))
		headRow.appendChild(column)
	}
	
	addHeadColumn('Offset')
	addHeadColumn('00')
	addHeadColumn('01')
	addHeadColumn('02')
	addHeadColumn('03')
	addHeadColumn('04')
	addHeadColumn('05')
	addHeadColumn('06')
	addHeadColumn('07')
	addHeadColumn('08')
	addHeadColumn('09')
	addHeadColumn('0A')
	addHeadColumn('0B')
	addHeadColumn('0C')
	addHeadColumn('0D')
	addHeadColumn('0E')
	addHeadColumn('0F')
	
	table.appendChild(headRow)
	
	parent.appendChild(table)
	
	
	var rows = []
	
	function appendRow(index) {
		var row = document.createElement('tr')
		var offset = document.createElement('td')
		offset.appendChild(document.createTextNode(numberToHexString(index)))
		offset.style.userSelect = 'none'
		row.appendChild(offset)
		table.appendChild(row)
		row.cols = []
		rows.push(row)
		
		return row
	}
	
	function removeRow() {
		var lastRow = rows[rows.length - 1]
		lastRow.parentNode.removeChild(lastRow)
		rows.splice(rows.length - 1, 1)
	}
	
	appendRow(0)
	
	
	function removeColumn() {
		var lastRow = rows[rows.length - 1]
		var lastCol = lastRow.cols[lastRow.cols.length - 1]
		lastRow.removeChild(lastCol)
		lastRow.cols.splice(lastRow.cols.length - 1, 1)
		
		if(!lastRow.cols.length && rows.length > 1) {
			removeRow()
		}
	}
	
	function updateColumns() {
		rows.forEach(function(row) {
			row.cols.forEach(function(col) {
				col.updateColumn()
			})
		})
	}
	
	function selectColumn(rowIndex, colIndex, selection) {
		var nextInput = rows[rowIndex].cols[colIndex].querySelector(':scope > input')
		nextInput.focus()
		nextInput.selectionStart = selection
		nextInput.selectionEnd = selection
		
		return nextInput
	}
	
	function appendColumn(byte, index) {
		var row = rows[rows.length - 1]
		
		if(row.cols.length == 16) {
			row = appendRow(index)
		}
		
		var col = document.createElement('td')
		var input = document.createElement('input')
		input.value = byteToString(byte)
		col.appendChild(input)
		row.appendChild(col)
		row.cols.push(col)
		
		col.updateColumn = function() {
			input.value = byteToString(bytes[index])
		}
		
		input.onkeydown = function(event) {
			event.preventDefault()
			var key = event.key.toUpperCase()
			
			var fullIndex = index === undefined
				? bytes.length
				: index
			var rowIndex = (fullIndex / 16) | 0
			var colIndex = fullIndex % 16
			
			switch(key) {
				case '0': case '1': case '2': case '3':
				case '4': case '5': case '6': case '7':
				case '8': case '9': case 'A': case 'B':
				case 'C': case 'D': case 'E': case 'F': {
					if(index === undefined) {
						index = bytes.length
						appendColumn()
					}
					
					if(input.selectionStart === input.selectionEnd && input.selectionStart === 0) {
						var byte = bytes[index]
						byte = (byte & 0x0F) | (getHexNumber(key) << 4)
						bytes[index] = byte
						
						input.value = byteToString(byte)
						
						input.selectionStart = 1
						input.selectionEnd = 1
						onChange(bytes, fullIndex)
					}
					else if(input.selectionStart === input.selectionEnd && input.selectionStart === 1) {
						var byte = bytes[index]
						byte = (byte & 0xF0) | getHexNumber(key)
						bytes[index] = byte
						
						input.value = byteToString(byte)
						
						input.selectionStart = 2
						input.selectionEnd = 2
						onChange(bytes, fullIndex)
					}
					else if(input.selectionStart === input.selectionEnd && input.selectionStart === 2) {
						if(colIndex == 15) {
							selectColumn(rowIndex + 1, 0, 0)
								.onkeydown(event)
						}
						else {
							selectColumn(rowIndex, colIndex + 1, 0)
								.onkeydown(event)
						}
					}
					
					break
				}
				
				case 'ARROWLEFT': {
					if(colIndex) {
						selectColumn(rowIndex, colIndex - 1, 0)
					}
					else if(rowIndex) {
						selectColumn(rowIndex - 1, 15, 0)
					}
					break
				}
				
				case 'ARROWRIGHT': {
					if(colIndex != 15) {
						if(rowIndex == rows.length - 1) {
							if(colIndex < rows[rowIndex].cols.length - 1) {
								selectColumn(rowIndex, colIndex + 1, 0)
							}	
						}
						else {
							selectColumn(rowIndex, colIndex + 1, 0)
						}
					}
					else if(rowIndex != rows.length - 1) {
						selectColumn(rowIndex + 1, 0, 0)
					}
					break
				}
				
				case 'ARROWUP': {
					if(rowIndex) {
						selectColumn(rowIndex - 1, colIndex, 0)
					}
					break
				}
				
				case 'ARROWDOWN': {
					if(rowIndex < rows.length - 1) {
						selectColumn(rowIndex + 1, colIndex, 0)
					}
					break
				}
				
				case 'DELETE': {
					if(index === undefined) {
						return
					}
					
					bytes.splice(index, 1)
					
					removeColumn()
					removeColumn()
					appendColumn()
					
					updateColumns()
					onChange(bytes, index)
					break
				}
			}
		}
		
		input.onpaste = function(event) {
			var data = event.clipboardData.getData('text')
			
			/*for(var i = 0; i < data.length; ++i) {
				input.onkeydown({
					key: data[i],
					preventDefault: function(){}
				})
			}*/
		}
		
		input.onfocus = function() {
			var fullIndex = index === undefined
				? bytes.length
				: index
			var rowIndex = (fullIndex / 16) | 0
			var colIndex = fullIndex % 16
			
			onSelect(rowIndex * 16 + colIndex)
		}
		
		input.onblur = function() {
			onSelect(-1)
		}
	}
	
	bytes.forEach(function(byte, index) {
		appendColumn(byte, index)
	})
	
	appendColumn()
}