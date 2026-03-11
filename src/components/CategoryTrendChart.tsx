import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip);

const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);

const CATEGORIES: Record<string, { label: string; color: string }> = {
  technical_core: { label: 'Programming',   color: '#60a5fa' },
  hardware:       { label: 'Hardware',       color: '#b0c4de' },
  obsluha_kodu:   { label: 'Code Ops',       color: '#67e8f9' },
  architecture:   { label: 'Architecture',   color: '#fb923c' },
  product:        { label: 'Product',        color: '#4ade80' },
  ux:             { label: 'UX / Frontend',  color: '#c084fc' },
  team:           { label: 'Team & Culture', color: '#f87171' },
  meta:           { label: 'Meta Skills',    color: '#2dd4bf' },
  ai:             { label: 'AI & ML',        color: '#FFCD68' },
};

export default function CategoryTrendChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/data/skills-timeline.json')
      .then(r => r.json())
      .then(data => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const skills = data.skills as Array<{ category: string; values: Record<string, number> }>;

        const datasets = Object.entries(CATEGORIES).map(([key, cat]) => {
          const catSkills = skills.filter(s => s.category === key);
          const chartData = YEARS.map(y => {
            const vals = catSkills.map(s => s.values[String(y)] ?? 0);
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { x: y, y: Math.round(avg * 100) / 100 };
          });
          return {
            label: cat.label,
            data: chartData,
            borderColor: cat.color,
            backgroundColor: 'transparent',
            borderWidth: 3.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.35,
          };
        });

        // Overall average
        const overallData = YEARS.map(y => {
          const vals = skills.map(s => s.values[String(y)] ?? 0);
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { x: y, y: Math.round(avg * 100) / 100 };
        });
        datasets.push({
          label: 'Overall Average',
          data: overallData,
          borderColor: '#ffffff',
          backgroundColor: 'transparent',
          borderWidth: 4.5,
          borderDash: [6, 3],
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.35,
        } as any);

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
                  callback: (v: any) => (Number.isInteger(v) && v % 5 === 0) ? String(v) : '',
                  maxRotation: 0,
                },
                grid: { color: 'rgba(58,58,58,0.8)' },
                border: { color: '#3a3a3a' },
              },
              y: {
                min: 0,
                max: 10,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  stepSize: 1,
                  callback: (v: any) => {
                    if (v === 5) return '5 – useful';
                    if (v === 8) return '8 – expected';
                    if (v === 10) return '10 – standard';
                    return v;
                  },
                },
                grid: {
                  color: (ctx2: any) => {
                    const v = ctx2.tick?.value;
                    if (v === 5 || v === 8 || v === 10) return 'rgba(255,205,104,0.12)';
                    return 'rgba(58,58,58,0.5)';
                  },
                },
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
                  title: (items: any[]) => items[0]?.dataset?.label ?? '',
                  label: (item: any) => `avg: ${Number(item.parsed.y).toFixed(2)}`,
                },
              },
            },
          },
        });
      });
  }, []);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <div style={{ width: 24, height: 4, borderRadius: 2, background: cat.color }} />
            {cat.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div style={{ width: 24, height: 4, borderRadius: 2, background: '#ffffff' }} />
          Overall Average
        </div>
      </div>
      <div style={{ height: 460 }}><canvas ref={canvasRef} /></div>
    </div>
  );
}
