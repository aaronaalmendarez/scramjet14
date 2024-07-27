import { encodeUrl } from "../shared";

export default function (client, self) {
	self.$sImport = function (base) {
		return function (url) {
			const resolved = new URL(url, base).href;

			return function () {}.constructor(
				`return import("${encodeUrl(resolved)}")`
			)();
		};
	};
}
