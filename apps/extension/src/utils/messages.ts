import { defineExtensionMessaging } from "@webext-core/messaging";

export interface TradePageInfo {
  supported: boolean;
  url: string;
  title: string;
}

interface ProtocolMap {
  csTradePageInfo(): TradePageInfo;
  spTradePageInfo(): TradePageInfo;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
