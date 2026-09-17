import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Headcount over the year, one point per month.
//
// The earlier version drew the line and nothing else — no axes, no grid, no
// margin. Recharts then fitted the y-domain exactly to the data, so a series
// like 0,0,0,0,6,6,6 was drawn flat along the very bottom and then flat along
// the very top, with the dots at each end clipped by the edge of the box. It
// read as a stretched, broken chart rather than as "nobody joined until August".
//
// Three things fix it, and all three are about giving the line somewhere to sit:
// an axis on each side, headroom above the maximum, and margins wide enough that
// a dot at the edge is not cut in half.

// Recharts renders SVG, so Tailwind's dark: classes do not reach inside it.
// These are picked to stay legible on both a white and a slate-800 card rather
// than being right for one and washed out on the other.
const AXIS = "#94a3b8";   // slate-400
const GRID = "#94a3b833"; // the same, mostly transparent
const LINE = "#6366f1";   // indigo-500, matching the rest of the dashboard

const EmployeeGrowthChart = ({ data = [], height = 180 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs"
           style={{ height }}>
        No data yet
      </div>
    );
  }

  // A flat series has a zero-height domain, which Recharts draws as a line
  // through the middle of nowhere. Giving it a floor and a ceiling keeps a
  // company that hired nobody this year looking flat rather than broken.
  const max = Math.max(...data.map((d) => d.employees || 0));
  const ceiling = Math.max(4, Math.ceil(max * 1.25));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: AXIS, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          interval="preserveStartEnd"
          minTickGap={8}
        />
        <YAxis
          domain={[0, ceiling]}
          allowDecimals={false}
          width={44}
          tick={{ fill: AXIS, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 10,
            fontSize: 12,
            color: "#e2e8f0"
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value) => [value, "Employees"]}
          cursor={{ stroke: GRID }}
        />
        <Line
          type="monotone"
          dataKey="employees"
          stroke={LINE}
          strokeWidth={2.5}
          dot={{ fill: LINE, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EmployeeGrowthChart;
