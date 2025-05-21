import { WalletType } from "graz";

export const mainnetWallets = [
	WalletType.LEAP,
	WalletType.WC_LEAP_MOBILE,
	WalletType.KEPLR,
	WalletType.WC_KEPLR_MOBILE,
	WalletType.WALLETCONNECT,
	// WalletType.COMPASS,
	// {
	// 	name: WalletType.METAMASK_SNAP_LEAP,
	// 	prettyName: "Metamask",
	// },
];

export const testnetWallets = [...mainnetWallets, WalletType.INITIA];