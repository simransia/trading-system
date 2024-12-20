"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface MarketData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  priceHistory: PricePoint[];
}

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface BinanceKline {
  0: number; // Open time
  4: string; // Close price
  5: string; // Volume
}

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT"];

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [tickerResponses, klineResponses] = await Promise.all([
          // Get current price and 24h change
          Promise.all(
            symbols.map((symbol) =>
              fetch(
                `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
              ).then((res) => res.json())
            )
          ),
          // Get historical kline/candlestick data
          Promise.all(
            symbols.map((symbol) =>
              fetch(
                `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=30`
              ).then((res) => res.json())
            )
          ),
        ]);

        const formattedData = tickerResponses.map((data, index) => ({
          symbol: data.symbol,
          price: parseFloat(data.lastPrice).toFixed(2),
          priceChangePercent: data.priceChangePercent,
          priceHistory: klineResponses[index].map((kline: BinanceKline) => ({
            timestamp: kline[0],
            price: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
          })),
        }));

        setMarketData(formattedData);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg text-white p-4">
      <h2 className="text-xl mb-4">Markets Overview</h2>
      <div className="grid grid-cols-4 gap-4">
        {marketData.map((data) => (
          <div key={data.symbol} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold">
                {data.symbol.replace("USDT", "")}
              </span>
              <span
                className={`text-sm ${
                  parseFloat(data.priceChangePercent) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {parseFloat(data.priceChangePercent).toFixed(2)}%
              </span>
            </div>
            <div className="text-2xl mb-3">${data.price}</div>

            {/* Price Area Chart */}
            <div className="h-16 mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.priceHistory}>
                  <defs>
                    <linearGradient
                      id={`gradient-${data.symbol}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={
                          parseFloat(data.priceChangePercent) >= 0
                            ? "#22c55e"
                            : "#ef4444"
                        }
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          parseFloat(data.priceChangePercent) >= 0
                            ? "#22c55e"
                            : "#ef4444"
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["auto", "auto"]} hide />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={
                      parseFloat(data.priceChangePercent) >= 0
                        ? "#22c55e"
                        : "#ef4444"
                    }
                    fillOpacity={1}
                    fill={`url(#gradient-${data.symbol})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Bar Chart */}
            <div className="h-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.priceHistory}>
                  <YAxis domain={["auto", "auto"]} hide />
                  <Bar
                    dataKey="volume"
                    fill="#6b7280"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketOverview;
