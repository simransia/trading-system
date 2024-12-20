"use client";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import DateTimePicker from "react-datetime-picker";
import { useState, useEffect } from "react";
import { fetchBinanceSymbols } from "@/services/binance";
import { useOrderStore } from "@/store/orders";
import { durationOptions } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-red-400 text-xs mt-1">{message}</p>
);

interface FormData {
  asset: string;
  quantity: number;
  price: number;
  type: "BUY" | "SELL";
  expirationDuration?: number;
  expirationUnit?: string;
  expirationDatetime?: Date | string;
}

const OrderCreationForm = () => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState("duration");
  const [error, setError] = useState<string | null>(null);

  const { addOrder } = useOrderStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const orderType = watch("type");

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
      expirationDatetime: z.union([z.date(), z.string()]).optional(),
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

    try {
      const userId = localStorage.getItem("userId");

      // Calculate expiration time
      let expirationTime: string;
      if (selectedExpiration === "duration" && data.expirationDuration) {
        const multiplier =
          durationOptions.find((opt) => opt.value === data.expirationUnit)
            ?.multiplier || 1;
        const durationInMs =
          Number(data.expirationDuration) * multiplier * 1000;
        expirationTime = new Date(Date.now() + durationInMs).toISOString();
      } else if (data.expirationDatetime) {
        // Convert Date object or string to ISO string
        expirationTime = new Date(data.expirationDatetime).toISOString();
      } else {
        throw new Error("Invalid expiration time");
      }

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
          type: data.type,
          userId: userId || "507f1f77bcf86cd799439011",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order");
      }

      const newOrder = await response.json();
      addOrder(newOrder);
      setError(null);
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
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-200 mb-6">Place Order</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset
            </label>
            <Controller
              name="asset"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full bg-[#2A2E39] border-gray-700 text-gray-200">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2E39] border-gray-700">
                    {symbols.map((symbol) => (
                      <SelectItem
                        key={symbol}
                        value={symbol}
                        className="text-gray-200 focus:bg-gray-700 focus:text-gray-200"
                      >
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.asset && (
              <ErrorMessage message={errors.asset.message || ""} />
            )}
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order Type
            </label>
            <Controller
              name="type"
              control={control}
              defaultValue="BUY"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full bg-[#2A2E39] border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2E39] border-gray-700">
                    <SelectItem
                      value="BUY"
                      className="text-green-500 focus:bg-gray-700 focus:text-green-500"
                    >
                      Buy
                    </SelectItem>
                    <SelectItem
                      value="SELL"
                      className="text-red-500 focus:bg-gray-700 focus:text-red-500"
                    >
                      Sell
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              {...register("quantity", { required: true })}
              className="w-full bg-[#2A2E39] border border-gray-700 text-gray-200 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price
            </label>
            <input
              type="number"
              step="any"
              {...register("price", { required: true })}
              className="w-full bg-[#2A2E39] border border-gray-700 text-gray-200 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Expiration Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Expiration
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="duration"
                checked={selectedExpiration === "duration"}
                onChange={() => setSelectedExpiration("duration")}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-300">Duration</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="datetime"
                checked={selectedExpiration === "datetime"}
                onChange={() => setSelectedExpiration("datetime")}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-300">
                Specific Date & Time
              </span>
            </label>
          </div>

          {selectedExpiration === "duration" && (
            <div className="flex gap-2">
              <input
                type="number"
                {...register("expirationDuration")}
                className="flex-1 bg-[#2A2E39] border border-gray-700 text-gray-200 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Duration"
              />
              <Controller
                name="expirationUnit"
                control={control}
                defaultValue={durationOptions[0].value}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-1/3 bg-[#2A2E39] border-gray-700 text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2E39] border-gray-700">
                      {durationOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-gray-200 focus:bg-gray-700 focus:text-gray-200"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {selectedExpiration === "datetime" && (
            <Controller
              control={control}
              name="expirationDatetime"
              render={({ field: { onChange, value } }) => (
                <DateTimePicker
                  onChange={onChange}
                  value={value}
                  className="w-full bg-[#2A2E39] border border-gray-700 text-gray-200 rounded-lg"
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
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            orderType === "SELL"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          Place {orderType === "SELL" ? "Sell" : "Buy"} Order
        </button>
      </form>
    </div>
  );
};

export default OrderCreationForm;
