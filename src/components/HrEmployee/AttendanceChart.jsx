import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const AttendanceChart = ({ present, absent }) => {
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#4F46E5" radius={8} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
