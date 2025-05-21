export interface WalletEventDetail {
	name: string;
	connectionType: string;
	address: string;
	logoUrl?: string;
}

export interface WalletConnectEvent extends Event {
	detail: WalletEventDetail;
}

export interface WalletDisconnectEvent extends Event {
	detail: {
		connectionType: string;
	};
}