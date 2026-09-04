import { sendMessage, type TradePageInfo } from "../utils/messages";

/** Gets trade-page context from the content script in the active tab. */
export async function getActiveTradePageInfo(): Promise<TradePageInfo> {
  return sendMessage("spTradePageInfo");
}
