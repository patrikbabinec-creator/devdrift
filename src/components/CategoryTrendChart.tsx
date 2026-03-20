import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { useMediaQuery } from './useMediaQuery';

Chart.register(RadarController, RadialLinearScale, LineElement, PointElement, Filler, Tooltip);

const CATEGORIES: Record<string, { label: string; color: string; desc: string }> = {
  technical_core: { label: 'Programming',   color: '#60a5fa', desc: 'Language mastery, algorithms, data structures, refactoring, SQL, design patterns, type systems' },
  hardware:       { label: 'Hardware',       color: '#b0c4de', desc: 'Memory management, CPU architectures, hardware impact on code performance' },
  obsluha_kodu:   { label: 'Code Ops',       color: '#67e8f9', desc: 'Debugging, automated testing, version control, software distribution' },
  architecture:   { label: 'Architecture',   color: '#fb923c', desc: 'System modularity, abstractions, integration, distributed systems, scaling, observability, security, cloud' },
  product:        { label: 'Product',        color: '#4ade80', desc: 'Product thinking, trade-off prioritization, iterative delivery, CI/CD pipelines' },
  ux:             { label: 'UX / Frontend',  color: '#c084fc', desc: 'User empathy, implementation usability, accessibility, web performance' },
  team:           { label: 'Team & Culture', color: '#f87171', desc: 'Tech-business communication, technical negotiation, developer mentoring' },
  meta:           { label: 'Meta Skills',    color: '#2dd4bf', desc: 'Working with uncertainty, technology radar, personal sustainability, technical writing' },
  ai:             { label: 'AI & ML',        color: '#FFCD68', desc: 'Prompt engineering, AI output validation, AI workflow orchestration, ML concepts' },
};

const CAT_KEYS = Object.keys(CATEGORIES);
const CAT_LABELS = CAT_KEYS.map(k => CATEGORIES[k].label);

const PRESET_YEARS = [1980, 1990, 2000, 2010, 2020, 2026];

interface SkillData {
  category: string;
  values: Record<string, number>;
}

function computeAvgs(skills: SkillData[], year: number): number[] {
  return CAT_KEYS.map(key => {
    const catSkills = skills.filter(s => s.category === key);
    const vals = catSkills.map(s => s.values[String(year)] ?? 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  });
}

export default function CategoryTrendChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [compareYear, setCompareYear] = useState<number | null>(2000);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetch('/data/skills-timeline.json')
      .then(r => r.json())
      .then(data => setSkills(data.skills));
  }, []);

  const buildChart = useCallback(() => {
    if (!skills.length || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const primaryAvgs = computeAvgs(skills, selectedYear);

    const datasets: any[] = [{
      label: String(selectedYear),
      data: primaryAvgs,
      borderColor: '#FFCD68',
      backgroundColor: 'rgba(255,205,104,0.15)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: '#FFCD68',
      pointBorderColor: '#1E1E1E',
      pointBorderWidth: 2,
      pointHoverRadius: 7,
      fill: true,
    }];

    if (compareYear !== null && compareYear !== selectedYear) {
      const compareAvgs = computeAvgs(skills, compareYear);
      datasets.push({
        label: String(compareYear),
        data: compareAvgs,
        borderColor: 'rgba(148,163,184,0.6)',
        backgroundColor: 'rgba(148,163,184,0.08)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 3,
        pointBackgroundColor: 'rgba(148,163,184,0.6)',
        pointBorderColor: '#1E1E1E',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
        fill: true,
      });
    }

    const isMobileNow = window.matchMedia('(max-width: 768px)').matches;

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: CAT_LABELS,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              color: '#64748b',
              font: { size: isMobileNow ? 10 : 11 },
              backdropColor: 'transparent',
              callback: (v: any) => v === 0 ? '' : String(v),
            },
            grid: {
              color: 'rgba(58,58,58,0.6)',
            },
            angleLines: {
              color: 'rgba(58,58,58,0.4)',
            },
            pointLabels: {
              color: (ctx: any) => {
                const key = CAT_KEYS[ctx.index];
                return CATEGORIES[key]?.color ?? '#94a3b8';
              },
              font: {
                size: isMobileNow ? 11 : 13,
                weight: '600',
                family: 'Inter, system-ui, sans-serif',
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#252525',
            borderColor: '#3a3a3a',
            borderWidth: 1,
            titleColor: '#F2F0E5',
            titleFont: { size: 14, weight: '700' },
            bodyColor: '#94a3b8',
            bodyFont: { size: 13 },
            padding: 14,
            boxWidth: 0,
            boxHeight: 0,
            callbacks: {
              title: (items: any[]) => {
                const idx = items[0]?.dataIndex;
                return idx !== undefined ? CAT_LABELS[idx] : '';
              },
              afterTitle: (items: any[]) => {
                const idx = items[0]?.dataIndex;
                if (idx === undefined) return '';
                const key = CAT_KEYS[idx];
                return CATEGORIES[key]?.desc ?? '';
              },
              label: (item: any) => `${item.dataset.label}: ${Number(item.parsed.r).toFixed(1)}`,
            },
          },
        },
      },
    });
  }, [skills, selectedYear, compareYear, isMobile]);

  useEffect(() => { buildChart(); return () => { chartRef.current?.destroy(); chartRef.current = null; }; }, [buildChart]);

  const sliderBtnStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? '#FFCD6825' : '#2e2e2e',
    border: `1.5px solid ${isActive ? '#FFCD68' : '#3a3a3a'}`,
    borderRadius: '999px',
    color: isActive ? '#FFCD68' : '#94a3b8',
    cursor: 'pointer',
    fontSize: isMobile ? '0.8rem' : '0.85rem',
    fontWeight: isActive ? 700 : 500,
    padding: isMobile ? '0.4rem 0.7rem' : '0.3rem 0.75rem',
    minHeight: isMobile ? 36 : 'auto',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.15s',
  });

  const compareBtnStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'rgba(148,163,184,0.12)' : '#2e2e2e',
    border: `1.5px solid ${isActive ? '#94a3b8' : '#3a3a3a'}`,
    borderRadius: '999px',
    color: isActive ? '#94a3b8' : '#64748b',
    cursor: 'pointer',
    fontSize: isMobile ? '0.75rem' : '0.8rem',
    fontWeight: isActive ? 600 : 400,
    padding: isMobile ? '0.35rem 0.6rem' : '0.25rem 0.65rem',
    minHeight: isMobile ? 34 : 'auto',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Year selector */}
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: isMobile ? '0.35rem' : '0.5rem',
          marginBottom: '0.5rem',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginRight: '0.2rem' }}>Year:</span>
          {PRESET_YEARS.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)} style={sliderBtnStyle(y === selectedYear)}>
              {y}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: isMobile ? '0.3rem' : '0.4rem',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '0.2rem' }}>Compare:</span>
          <button
            onClick={() => setCompareYear(null)}
            style={compareBtnStyle(compareYear === null)}
          >None</button>
          {PRESET_YEARS.filter(y => y !== selectedYear).map(y => (
            <button key={y} onClick={() => setCompareYear(y)} style={compareBtnStyle(y === compareYear)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#FFCD68' }}>
          <div style={{ width: 20, height: 3, borderRadius: 2, background: '#FFCD68' }} />
          {selectedYear}
        </div>
        {compareYear !== null && compareYear !== selectedYear && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div style={{ width: 20, height: 2, borderRadius: 2, background: '#94a3b8', opacity: 0.6 }} />
            {compareYear} (compare)
          </div>
        )}
      </div>

      {/* Chart */}
      <div
        style={{ height: isMobile ? 340 : 480, maxWidth: 600, margin: '0 auto', position: 'relative' }}
        onMouseMove={(e) => {
          const chart = chartRef.current;
          if (!chart) return;
          const rScale = chart.scales.r as any;
          if (!rScale) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const ratio = window.devicePixelRatio || 1;
          const cx = mx * ratio;
          const cy = my * ratio;

          let found: string | null = null;
          for (let i = 0; i < CAT_KEYS.length; i++) {
            const lp = rScale.getPointLabelPosition(i);
            if (!lp) continue;
            const dx = cx - lp.x;
            const dy = cy - lp.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40 * ratio) {
              found = CAT_KEYS[i];
              break;
            }
          }
          setHoveredCat(found);
        }}
        onMouseLeave={() => setHoveredCat(null)}
      >
        <canvas ref={canvasRef} />

        {/* Category label tooltip */}
        {hoveredCat && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,30,30,0.95)',
            border: `1px solid ${CATEGORIES[hoveredCat].color}55`,
            borderRadius: '0.5rem',
            padding: '0.5rem 0.8rem',
            maxWidth: isMobile ? '90%' : 400,
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <div style={{
              color: CATEGORIES[hoveredCat].color,
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '0.2rem',
              fontFamily: 'Raleway, Arial Black, sans-serif',
            }}>
              {CATEGORIES[hoveredCat].label}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>
              {CATEGORIES[hoveredCat].desc}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
