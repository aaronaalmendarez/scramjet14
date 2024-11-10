import { ScramjetClient } from "../client";

export default function (client: ScramjetClient, self: typeof window) {
	client.Trap("Element.prototype.attributes", {
		get(ctx) {
			const map = ctx.get() as NamedNodeMap;
			const proxy = new Proxy(map, {
				get(target, prop, receiver) {
					const value = Reflect.get(target, prop);

					if (prop === "length") {
						return Object.keys(proxy).length;
					}

					if (prop === "getNamedItem") {
						return (name: string) => proxy[name];
					}
					if (prop === "getNamedItemNS") {
						return (namespace: string, name: string) =>
							proxy[`${namespace}:${name}`];
					}

					if (prop in NamedNodeMap.prototype && typeof value === "function") {
						return new Proxy(value, {
							apply(target, thisArg, argArray) {
								if (thisArg === proxy) {
									return Reflect.apply(target, map, argArray);
								}

								return Reflect.apply(target, thisArg, argArray);
							},
						});
					}

					if (
						(typeof prop === "string" || typeof prop === "number") &&
						!isNaN(Number(prop))
					) {
						const position = Object.keys(proxy)[prop];

						return map[position];
					}

					if (!this.has(target, prop)) return undefined;

					return value;
				},
				ownKeys(target) {
					const keys = Reflect.ownKeys(target);

					return keys.filter((key) => this.has(target, key));
				},
				has(target, prop) {
					if (typeof prop === "symbol") return Reflect.has(target, prop);
					if (prop.startsWith("scramjet-data-")) return false;
					if (map[prop]?.name?.startsWith("scramjet-data-")) return false;

					return Reflect.has(target, prop);
				},
			});

			return proxy;
		},
	});

	client.Trap("Attr.prototype.value", {
		get(ctx) {
			return ctx.this.ownerElement.getAttribute(ctx.this.name);
		},
		set(ctx, value) {
			return ctx.this.ownerElement.setAttribute(ctx.this.name, value);
		},
	});
}
