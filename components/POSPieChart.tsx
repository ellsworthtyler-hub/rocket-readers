// components/POSPieChart.tsx

'use client';

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function POSPieChart() {
  const data = {
    labels: ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Other"],
    datasets: [{
      data: [35, 25, 15, 10, 10, 5],
      backgroundColor: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#34495e"],
    }],
  };
  return <Pie data={data} />;
}