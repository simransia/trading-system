"use client";
import { useEffect, useState } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

const Chart = () => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      try {
        ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "PRICE_UPDATE") {
            setPriceHistory((prev) => {
              const newHistory = [
                ...prev,
                {
                  time: new Date().toLocaleTimeString(),
                  price: data.price,
                  volume: data.volume || 0,
                },
              ];
              return newHistory.slice(-30);
            });
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatVolume = (value: number) => `${value.toFixed(4)} BTC`;

  return (
    <div className="bg-[#0B0E11] p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-200">BTC-USDT</h3>
        <div className="text-gray-400 text-sm">
          <span className="mr-4">24h Change: +2.34%</span>
          <span>24h Volume: 12,345 BTC</span>
        </div>
      </div>
      <div className="h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={priceHistory}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#2A2E39"
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#7D8086" }}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#7D8086" }}
              tickFormatter={formatPrice}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              domain={[0, "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#7D8086" }}
              tickFormatter={formatVolume}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E2329",
                borderColor: "#2A2E39",
                borderRadius: "4px",
              }}
              labelStyle={{ color: "#7D8086" }}
              itemStyle={{ color: "#EDF0F4" }}
              formatter={(value: number, name: string) => {
                if (name === "Price") return formatPrice(value);
                if (name === "Volume") return formatVolume(value);
                return value;
              }}
            />
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ECB81" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0ECB81" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#0ECB81"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#2A2E39"
              opacity={0.8}
              barSize={20}
            />
            <Brush
              dataKey="time"
              height={40}
              stroke="#2A2E39"
              fill="#1E2329"
              tickFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
