const BINANCE_API = "https://api.binance.com/api/v3";

export interface BinanceSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export const fetchBinanceSymbols = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BINANCE_API}/exchangeInfo`);
    const data = await response.json();

    console.log(data, "data");

    // Filter for USDT pairs only
    const usdtPairs = data.symbols
      .filter(
        (symbol: BinanceSymbol) =>
          symbol.quoteAsset === "USDT" && symbol.symbol.endsWith("USDT")
      )
      .map((symbol: BinanceSymbol) => symbol.symbol);

    return usdtPairs;
  } catch (error) {
    console.error("Failed to fetch Binance symbols:", error);
    return ["BTC-USDT"]; // Fallback to default pair
  }
};
