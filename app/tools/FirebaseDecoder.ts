interface FirebaseDecoderProps {
	error: string;
}

function FirebaseDecoder({ error }: FirebaseDecoderProps): string {
	const decodeError = (raw: string): string => {
		// 1) Pull out whatever’s between "auth/" and the closing ")"
		const match = raw.match(/auth\/([a-z0-9-]+)\)/i);
		if (!match) {
			// if it doesn’t fit that pattern, just return the original
			return raw;
		}

		// 2) Turn "too-many-requests" → "too many requests"
		const withSpaces = match[1].replace(/-/g, " ").toLowerCase();

		// 3) Capitalize first letter → "Too many requests"
		return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
	};

    console.log("FirebaseDecoder error:", decodeError(error));

	return decodeError(error);
}

export default FirebaseDecoder;