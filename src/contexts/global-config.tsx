import { ConnectKitProvider } from "@leapwallet/connect-kit-react";
import { ConnectedWallet } from "@leapwallet/embedded-wallet-sdk-react";
import { ComponentProps, createContext, useContext } from "react";

type GlobalConfig = {
	chainId: string;
	testnet: boolean;
	wallets: ComponentProps<typeof ConnectKitProvider>["wallets"];
	connectedWallets: ConnectedWallet[];
	chain: string;
};

export const GlobalConfigContext = createContext<GlobalConfig | null>(null);

export const GlobalConfigProvider = ({
	children,
	config,
}: { children: React.ReactNode; config: GlobalConfig }) => {
	return (
		<GlobalConfigContext.Provider value={config}>
			{children}
		</GlobalConfigContext.Provider>
	);
};

export const useGlobalConfig = () => {
	const context = useContext(GlobalConfigContext);
	if (!context) {
		throw new Error(
			"useGlobalConfig must be used within a GlobalConfigProvider",
		);
	}
	return context;
};