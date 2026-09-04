interface TradePageInfo {
  supported: boolean;
  url: string;
  itemName: string;
}

export function defineExtensionMessaging<_ProtocolMap>() {
  return {
    sendMessage: async (message: string): Promise<TradePageInfo> => {
      if (message !== "spTradePageInfo") {
        throw new Error(`Unsupported prototype message: ${message}`);
      }
      return {
        supported: true,
        url: "https://www.pathofexile.com/trade/search/Settlers/9qLkYdK",
        itemName: "Righteous Fire Inquisitor",
      };
    },
    onMessage: () => () => undefined,
  };
}
