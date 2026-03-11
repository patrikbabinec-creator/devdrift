import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Legend, Tooltip);

const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);

function fmtCount(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

export default function ComplexityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/data/complexity-data.json')
      .then(r => r.json())
      .then(data => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const keys = ['linuxLoc', 'npmPackages', 'annualCve', 'stackTechCount', 'projectBranches'] as const;

        const datasets = keys.map(key => {
          const series = data[key];
          return {
            label: series.label,
            data: YEARS.map(y => ({ x: y, y: series.values[String(y)] ?? null })),
            borderColor: series.color,
            backgroundColor: 'transparent',
            borderWidth: key === 'projectBranches' ? 4 : 3,
            borderDash: series.dash,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.3,
            _unit: series.unit,
          } as any;
        });

        new Chart(ctx, {
          type: 'line',
          data: { datasets },
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
                  maxRotation: 0,
                  callback: (v: any) => (Number.isInteger(v) && v % 5 === 0) ? String(v) : '',
                },
                grid: { color: 'rgba(58,58,58,0.8)' },
                border: { color: '#3a3a3a' },
              },
              y: {
                type: 'linear',
                min: 0,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  callback: (v: any) => fmtCount(v),
                },
                grid: { color: 'rgba(58,58,58,0.5)' },
                border: { color: '#3a3a3a' },
              },
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: '#94a3b8',
                  font: { size: 13 },
                  boxWidth: 28,
                  boxHeight: 4,
                  padding: 16,
                },
              },
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
                  title: (items: any[]) => `${items[0].dataset.label}  ·  ${String(Math.round(items[0].parsed.x))}`,
                  label: (item: any) => `${fmtCount(item.parsed.y)} ${(item.dataset as any)._unit}`,
                },
              },
            },
          },
        });
      });
  }, []);

  return <div style={{ height: 480 }}><canvas ref={canvasRef} /></div>;
}
