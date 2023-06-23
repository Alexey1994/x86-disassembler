function createDownloadLink(data) {
	var encoder = {
		previouse_byte: 0,
		position: 2,
		output: '',
		write_byte: function(t, byte) {
			encoder.output += byte
		}
	}

	function convert_byte_to_base64(byte)
	{
		if(byte < 26) {
			return String.fromCharCode(byte + 'A'.charCodeAt());
		}

		if(byte < 52) {
			return String.fromCharCode(byte + 'a'.charCodeAt() - 26);
		}

		if(byte < 62) {
			return String.fromCharCode(byte + '0'.charCodeAt() - 52);
		}

		if(byte == 62) {
			return String.fromCharCode('+'.charCodeAt());
		}

		return '/';
	}

	function encode_base64(byte) {
		encoder.write_byte(encoder.output, convert_byte_to_base64( (byte >> encoder.position) | encoder.previouse_byte) );
		encoder.previouse_byte = (byte & (0b00111111 >> (6 - encoder.position))) << (6 - encoder.position);

		if(encoder.position == 6) {
			encoder.write_byte(encoder.output, convert_byte_to_base64(encoder.previouse_byte));
			encoder.position = 2;
			encoder.previouse_byte = 0;
		}
		else {
			encoder.position = encoder.position + 2;
		}
	}


	function end_base64_encoder() {
		if(encoder.position != 2) {
			encoder.write_byte(encoder.output, convert_byte_to_base64(encoder.previouse_byte));

			if(encoder.position == 4) {
				encoder.write_byte(encoder.output, '=');
				encoder.write_byte(encoder.output, '=');
			}
			else {
				encoder.write_byte(encoder.output, '=');
			}
		}
	}
	
	data.forEach(byte => {
		encode_base64(byte)
	})
	end_base64_encoder()

	var base64_data = encoder.output

	return 'data:application/bin;base64,' + base64_data
}