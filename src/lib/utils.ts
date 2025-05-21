export function isTestnetApp() {
	return "window" in globalThis
		? window.location.hostname.startsWith("testnet")
		: false;
}