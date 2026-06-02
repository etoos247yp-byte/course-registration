'use client';
import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a ChartContainer");
  return context;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div ref={ref} className={`w-full ${className || ""}`} {...props}>
        <style dangerouslySetInnerHTML={{
          __html: `
            [data-chart="${chartId}"] {
              ${Object.entries(config)
                .map(([key, val]) => `--color-${key}: ${val.color || "black"};`)
                .join("\n")}
            }
          `
        }} />
        <div data-chart={chartId} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: any[];
    label?: string;
    hideLabel?: boolean;
    darkMode?: boolean;
  }
>(({ active, payload, label, hideLabel = false, darkMode = false, className, ...props }, ref) => {
  const { config } = useChart();

  if (!active || !payload || !payload.length) return null;

  return (
    <div
      ref={ref}
      className={`grid min-w-[8rem] items-start gap-1.5 rounded-lg border p-2.5 text-xs shadow-md ${
        darkMode
          ? "border-zinc-800 bg-zinc-950 text-zinc-100"
          : "border-zinc-200 bg-white text-zinc-950"
      } ${className || ""}`}
      {...props}
    >
      {!hideLabel && (
        <div className={`font-semibold ${darkMode ? "text-zinc-350" : "text-zinc-700"}`}>
          {label}
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = item.name || item.dataKey || "value";
          const configItem = config[key as string];
          const color = item.color || item.payload?.fill || configItem?.color;

          return (
            <div key={index} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className={darkMode ? "text-zinc-400" : "text-zinc-500"}>
                {configItem?.label || key}
              </span>
              <span className="font-semibold ml-auto">
                {item.value}명
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";
