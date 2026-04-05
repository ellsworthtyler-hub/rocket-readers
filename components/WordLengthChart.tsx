// components/WordLengthChart.tsx

'use client';

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement);

export default function WordLengthChart() {
  const data = {
    labels: ["3", "4", "5", "6", "7", "8", "9", "10", "11+", "20+"],
    datasets: [{
      label: "Word Length Count",
      data: [120, 180, 95, 65, 40, 25, 18, 12, 8, 3],
      backgroundColor: "#34d399",
    }],
  };
  return <Bar data={data} />;
}
