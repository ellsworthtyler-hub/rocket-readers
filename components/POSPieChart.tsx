// components/POSPieChart.tsx
'use client';

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

interface POSPieChartProps {
  data?: number[];           // e.g. [35, 25, 15, 10, 10, 5]
  labels?: string[];         // e.g. ["Noun", "Verb", ...]
}

export default function POSPieChart({ 
  data = [35, 25, 15, 10, 10, 5], 
  labels = ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Other"] 
}: POSPieChartProps) {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#34495e"],
    }],
  };
  return <Pie data={chartData} />;
}