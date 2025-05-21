import { useMemo } from "react";
import { AccountView, EmbeddedWalletProvider, StickyAggregatedView } from "@leapwallet/embedded-wallet-sdk-react";
import { motion } from "framer-motion";
import { useAccount } from "graz";
import { useWalletSupportedChains } from "@/contexts/wallet-supported-chains";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTurnkeyContext } from "@/contexts/social-login-context";
import { leapPasskey } from "@/contexts/passkey-context";
import { useChains } from "@leapwallet/elements-hooks";
import { cosmoshubChainId } from "@/lib/constants";
import { init } from "./utils";
import { useGlobalConfig } from "@/contexts/global-config";

const EmbeddedWallet: React.FC<{
	setEmbedWalletOpen: (open: boolean) => void;
	isEmbedWalletOpen: boolean;
	stickyView?: boolean;
}> = ({ setEmbedWalletOpen, isEmbedWalletOpen, stickyView = false }) => {
	init();
	const { connectedWallets} = useGlobalConfig();
	const { currentUser: socialWalletUser } = useTurnkeyContext()

	const { walletType } = useAccount({
		chainId: cosmoshubChainId,
	});
	const { colorScheme } = useColorScheme();
	const { data: cosmoChains } = useChains();

	const walletSupportedChains = useWalletSupportedChains();
	const { data: accounts } = useAccount({
		chainId: walletSupportedChains.map((c) => c.chainId),
		multiChain: true,
	});

	const socialWalletChainAddresses = leapPasskey.getAddressMap()

	const evmChains = useMemo(() => {
		const evmWallet = connectedWallets.find(wallet => wallet.type === 'evm');
		return evmWallet ? {
			"1": {
				address: evmWallet.address,
				chainType: "evm"
			},
			"984122": {
				address: evmWallet.address,
				chainType: "evm"
			},
		} as Record<string, { address: string, chainType: string }> : {};
	}, [connectedWallets]);

	const chainsRecords = useMemo(() => {
		const records: Record<
			string,
			{ address: string; restUrl: string | undefined; chainType: string }
		> = {};

		if (!!socialWalletUser && cosmoChains) {
			for (const c of cosmoChains) {
				const address = socialWalletChainAddresses[c.chainId];
				if (address) {
					records[c.chainId] = {
						address: address,
						restUrl: undefined,
						chainType: 'cosmos',
					};
				}
			}
		} else if (accounts) {
			for (const c of walletSupportedChains) {
				const account = accounts[c.chainId];
				if (account) {
					records[c.chainId] = {
						address: account.bech32Address,
						restUrl: undefined,
						chainType: 'cosmos',
					};
				}
			}
		}
		for (const c of Object.keys(evmChains)) {
			const account = evmChains[c];
			if (account) {
				records[c] = {
					address: account.address,
					chainType: account.chainType,
					restUrl: '',
				};
			}
		}
		return records;
	}, [accounts, walletSupportedChains, evmChains, socialWalletUser, socialWalletChainAddresses, cosmoChains]);


	if (stickyView) {
		return (
			<EmbeddedWalletProvider
				connectWallet={() => { }}
				disconnectWallet={() => { }}
				connectedWalletType={walletType}
			>
				<StickyAggregatedView
					theme={colorScheme}
					restrictChains={true}
					chainRecords={connectedWallets.length ? chainsRecords : {}}
					connectedWalletList={connectedWallets}
					onClose={() => setEmbedWalletOpen(false)}
					config={{
						showActionButtons: false,
						showWalletList: true,
					}}
				/>
			</EmbeddedWalletProvider>

		)
	}

	return (
		<motion.div
			data-open={isEmbedWalletOpen}
			key="embedded-wallet-framer-parent"
			className="absolute overflow-x-hidden w-full max-sm:w-[100svw] sm:max-w-[25rem] max-sm:right-0 sm:right-3 sm:mt-20 z-50 data-[open=false]:pointer-events-none"
		>
			<motion.div
				className="h-full w-full"
				variants={{
					close: {
						x: "100%",
						opacity: 0,
						filter: "blur(2px)",
					},
					open: {
						x: 0,
						opacity: 1,
						filter: "blur(0px)",
					},
				}}
				transition={{
					duration: 0.3,
					bounce: 0.15,
				}}
				animate={isEmbedWalletOpen ? "open" : "close"}
				initial="close"
			>
				<EmbeddedWalletProvider
					connectWallet={() => { }}
					disconnectWallet={() => { }}
					connectedWalletType={walletType}
				>
					<AccountView
						classnames="max-sm:w-[100dvw] sm:w-full max-sm:h-[100dvh] sm:h-[calc(100dvh-6rem)]"
						theme={colorScheme}
						restrictChains={true}
						chainRecords={connectedWallets.length ? chainsRecords : {}}
						connectedWalletList={connectedWallets}
						onClose={() => setEmbedWalletOpen(false)}
						config={{
							showActionButtons: false,
							showWalletList: true,
						}}
					/>
				</EmbeddedWalletProvider>
			</motion.div>
		</motion.div>
	);
};

export default EmbeddedWallet;
