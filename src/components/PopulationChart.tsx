import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);

export default function PopulationChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/data/population-data.json')
      .then(r => r.json())
      .then(data => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'Total developers worldwide (millions)',
              data: YEARS.map(y => ({ x: y, y: data.values[String(y)] ?? null })),
              borderColor: 'rgba(255,255,255,0.7)',
              backgroundColor: 'rgba(255,205,104,0.05)',
              borderWidth: 3,
              pointRadius: 0,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: '#FFCD68',
              pointHoverBorderColor: '#1E1E1E',
              pointHoverBorderWidth: 3,
              hitRadius: 15,
              tension: 0.35,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            animation: { duration: 300 },
            scales: {
              x: {
                type: 'linear',
                min: 1970,
                max: 2026,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  stepSize: 5,
                  callback: (v: any) => (Number.isInteger(v) && v % 5 === 0) ? String(v) : '',
                  maxRotation: 0,
                },
                grid: { color: 'rgba(58,58,58,0.8)' },
                border: { color: '#3a3a3a' },
              },
              y: {
                min: 0,
                max: 45,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  stepSize: 5,
                  callback: (v: any) => v === 0 ? '0' : `${v}M`,
                },
                grid: { color: 'rgba(58,58,58,0.5)' },
                border: { color: '#3a3a3a' },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#252525',
                borderColor: '#3a3a3a',
                borderWidth: 1,
                titleColor: '#F2F0E5',
                titleFont: { size: 14 },
                bodyColor: '#94a3b8',
                bodyFont: { size: 13 },
                padding: 14,
                callbacks: {
                  title: (items: any[]) => String(Math.round(items[0].parsed.x)),
                  label: (item: any) => `~${Number(item.parsed.y).toFixed(1)}M developers worldwide`,
                },
              },
            },
          },
        });
      });
  }, []);

  return <div style={{ height: 380 }}><canvas ref={canvasRef} /></div>;
}
