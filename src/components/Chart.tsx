"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

const Chart = () => {
  return <div className="bg-white p-4 rounded-lg shadow"></div>;
};

export default Chart;
