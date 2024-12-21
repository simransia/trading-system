"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
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
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = () => {
      try {
        if (ws?.readyState === WebSocket.OPEN) {
          return;
        }

        // Clear previous error
        setError(null);

        // If we've tried too many times, use simulated data
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          startSimulatedData();
          return;
        }

        ws = new WebSocket(API_BASE_URL.replace("http", "ws"));
        setConnectionStatus("connecting");

        ws.onopen = () => {
          setConnectionStatus("connected");
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "PRICE_UPDATE") {
              setPriceHistory((prev) => {
                const newPrice = {
                  time: new Date().toLocaleTimeString(),
                  price: data.price || 20000,
                  volume: data.volume || 0,
                };
                return [...prev.slice(-29), newPrice];
              });
            }
          } catch {
            // Silently handle parse errors
            console.warn("Failed to process message");
          }
        };

        ws.onerror = () => {
          setConnectionStatus("disconnected");
          setError("Connection lost. Using simulated data.");
          startSimulatedData();
        };

        ws.onclose = () => {
          setConnectionStatus("disconnected");
          reconnectAttempts++;

          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimeout = setTimeout(connect, 3000);
          } else {
            setError("Unable to connect. Using simulated data.");
            startSimulatedData();
          }
        };
      } catch {
        setConnectionStatus("disconnected");
        setError("Connection failed. Using simulated data.");
        startSimulatedData();
      }
    };

    // Simulate data when WebSocket fails
    const startSimulatedData = () => {
      const interval = setInterval(() => {
        const lastPriceValue =
          priceHistory[priceHistory.length - 1]?.price || 20000;
        const newPrice = lastPriceValue + (Math.random() - 0.5) * 100;
        const newVolume = Math.random() * 2;

        setPriceHistory((prev) => [
          ...prev.slice(-29),
          {
            time: new Date().toLocaleTimeString(),
            price: newPrice,
            volume: newVolume,
          },
        ]);
      }, 1000);

      return () => clearInterval(interval);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatVolume = (value: number) => `${value.toFixed(4)} BTC`;

  return (
    <div className="bg-[#0B0E11] p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-200">BTC-USDT</h3>
        <div className="flex items-center gap-4">
          <div className="text-gray-400 text-sm">
            <span className="mr-4">24h Change: +2.34%</span>
            <span>24h Volume: 12,345 BTC</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            {error && <span className="text-xs text-gray-400">{error}</span>}
          </div>
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
