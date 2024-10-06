import { Buffer } from "buffer";
import "react-native-get-random-values";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";

global.crypto.getRandomValues;
global.Buffer = require("buffer").Buffer;

// Polyfill for `crypto.getRandomValues`
class Crypto {
	getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
	if (typeof crypto === "undefined") {
		Object.defineProperty(global, "crypto", {
			configurable: true,
			enumerable: true,
			get: () => webCrypto,
		});
	}
})();
