"use client";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import DateTimePicker from "react-datetime-picker";
import { useState } from "react";
import { fetchBinanceSymbols } from "@/services/binance";
import { useEffect } from "react";
import { useOrderStore } from "@/store/orders";

interface DurationOption {
  value: string;
  label: string;
  multiplier: number;
}

const durationOptions: DurationOption[] = [
  { value: "seconds", label: "Seconds", multiplier: 1 },
  { value: "minutes", label: "Minutes", multiplier: 60 },
  { value: "hours", label: "Hours", multiplier: 3600 },
  { value: "days", label: "Days", multiplier: 86400 },
  { value: "weeks", label: "Weeks", multiplier: 604800 },
];

interface FormData {
  asset: string;
  quantity: number;
  price: number;
  expirationDuration?: number;
  expirationUnit?: string;
  expirationDatetime?: string;
  type: "BUY" | "SELL";
}

const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-red-500 text-sm mt-1">{message}</p>
);

const OrderCreationForm = () => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState("duration");
  const [error, setError] = useState<string | null>(null);

  const { addOrder } = useOrderStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // Define the Zod schema for FormData
  const formDataSchema = z
    .object({
      asset: z.string().nonempty("Asset is required"),
      quantity: z
        .number()
        .min(0.00001, "Minimum quantity is 0.00001")
        .max(1000, "Maximum quantity is 1000"),
      price: z
        .number()
        .min(0.01, "Minimum price is 0.01")
        .max(1000000, "Maximum price is 1,000,000"),
      type: z.enum(["BUY", "SELL"], {
        required_error: "Order type is required",
      }),
      expirationDuration: z.number().optional(),
      expirationUnit: z.string().optional(),
      expirationDatetime: z.string().optional(),
    })
    .refine(
      (data) => {
        // Validate expiration
        if (selectedExpiration === "duration") {
          return data.expirationDuration && data.expirationUnit;
        } else {
          return data.expirationDatetime;
        }
      },
      {
        message: "Please provide valid expiration details",
      }
    );

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    console.log(data, "data reached");
    const parsedData = {
      ...data,
      quantity: Number(data.quantity),
      price: Number(data.price),
      expirationDuration: data.expirationDuration
        ? Number(data.expirationDuration)
        : undefined,
    };

    // Validate data using Zod
    const validationResult = formDataSchema.safeParse(parsedData);
    if (!validationResult.success) {
      setError(
        validationResult.error.errors.map((err) => err.message).join(", ")
      );
      return;
    }

    // Calculate expiration time based on duration or datetime
    const expirationTime =
      selectedExpiration === "duration"
        ? new Date(
            Date.now() +
              Number(data.expirationDuration) *
                (durationOptions.find(
                  (opt) => opt.value === data.expirationUnit
                )?.multiplier || 1) *
                1000
          )
        : new Date(data.expirationDatetime || "");

    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: data.asset,
          quantity: data.quantity,
          price: data.price,
          expiration: expirationTime,
          type: data.type, // Now using the selected order type
          userId: userId || "507f1f77bcf86cd799439011", // Fallback if not logged in
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order");
      }

      const newOrder = await response.json();
      addOrder(newOrder);
      reset();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to place order"
      );
    }
  };

  useEffect(() => {
    const loadSymbols = async () => {
      const fetchedSymbols = await fetchBinanceSymbols();
      setSymbols(fetchedSymbols);
    };
    loadSymbols();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Asset</label>
        <select
          {...register("asset")}
          className="border rounded p-2 w-full"
          defaultValue=""
        >
          <option value="" disabled>
            Select an asset
          </option>
          {symbols.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
        {errors.asset && <ErrorMessage message={errors.asset.message || ""} />}
      </div>

      <div>
        <label className="block text-sm font-medium">Order Type</label>
        <select {...register("type")} className="border rounded p-2 w-full">
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Quantity</label>
        <input
          type="number"
          step="any"
          {...register("quantity", { required: true })}
          className="border rounded p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          step="any"
          {...register("price", { required: true })}
          className="border rounded p-2 w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Expiration</label>
        <div className="flex gap-4">
          <div>
            <input
              type="radio"
              value="duration"
              checked={selectedExpiration === "duration"}
              onChange={() => setSelectedExpiration("duration")}
            />
            <span className="ml-2">Duration</span>
          </div>
          <div>
            <input
              type="radio"
              value="datetime"
              checked={selectedExpiration === "datetime"}
              onChange={() => setSelectedExpiration("datetime")}
            />
            <span className="ml-2">Specific Date & Time</span>
          </div>
        </div>

        {selectedExpiration === "duration" ? (
          <div className="flex gap-2">
            <input
              type="number"
              {...register("expirationDuration")}
              className="border rounded p-2 flex-1"
              placeholder="Duration"
            />
            <select
              {...register("expirationUnit")}
              className="border rounded p-2"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Controller
            control={control}
            name="expirationDatetime"
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                onChange={onChange}
                value={value}
                className="bg-gray-700 text-white rounded-md"
                format="y-MM-dd h:mm:ss a"
                disableClock={false}
                calendarIcon={null}
                clearIcon={null}
                minDate={new Date()}
                required
              />
            )}
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Place Order
      </button>
    </form>
  );
};

export default OrderCreationForm;
