import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js';
import { useMediaQuery } from './useMediaQuery';

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip);

const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);

const DASH_PATTERNS: number[][] = [
  [],
  [9, 5],
  [3, 5],
  [12, 5, 3, 5],
  [6, 3],
  [2, 8],
  [15, 3],
  [8, 8],
  [5, 2, 5, 2],
  [10, 5],
  [2, 2],
  [18, 4, 2, 4],
  [4, 6, 8, 6],
  [1, 4],
  [12, 3, 3, 3, 3, 3],
  [6, 6],
];

const LINE_WIDTHS = [2.5, 2.0, 3.0, 2.0, 2.5, 1.8, 3.0, 2.0, 2.5, 2.0, 3.0, 1.8, 2.5, 2.0, 3.0, 2.0];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function skillColor(baseHex: string, index: number, total: number, alpha = 0.88): string {
  const [r, g, b] = hexToRgb(baseHex);
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const f = 0.6 + t * 0.5;
  const shift = ((index % 3) - 1) * 15;
  return `rgba(${Math.min(255, Math.round(r * f + shift))},${Math.min(255, Math.round(g * f - shift * 0.5))},${Math.min(255, Math.round(b * f + shift * 0.3))},${alpha})`;
}

interface Skill {
  name: string;
  category: string;
  description: string;
  values: Record<string, number>;
}

interface CategoryMeta {
  label: string;
  color: string;
}

interface KeyEvent {
  year: number;
  label: string;
}

interface SkillsChartProps {
  activeCategories: Set<string>;
  hiddenSkills: Set<string>;
  viewMode: 'categories' | 'skills';
}

export default function SkillsChart({ activeCategories, hiddenSkills, viewMode }: SkillsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryMeta>>({});
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [hoveredSkill, setHoveredSkill] = useState<{ name: string; catLabel: string; catColor: string; desc: string; year: number; val: number } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<typeof hoveredSkill>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    Promise.all([
      fetch('/data/skills-timeline.json').then(r => r.json()),
      fetch('/data/categories.json').then(r => r.json()),
      fetch('/data/key-events.json').then(r => r.json()),
    ]).then(([skillData, catData, eventsData]) => {
      setSkills(skillData.skills);
      setCategories(catData);
      setKeyEvents(eventsData);
    });
  }, []);

  function drawOverlay(chart: Chart, elRef: { datasetIndex: number; index: number } | null) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const c = overlay.getContext('2d');
    if (!c) return;

    const chartCanvas = chart.canvas;
    if (overlay.width !== chartCanvas.width || overlay.height !== chartCanvas.height) {
      overlay.width = chartCanvas.width;
      overlay.height = chartCanvas.height;
    }

    c.clearRect(0, 0, overlay.width, overlay.height);

    if (!elRef) return;
    const ds = chart.data.datasets[elRef.datasetIndex] as any;
    if (!ds || ds.hidden) return;
    const meta = chart.getDatasetMeta(elRef.datasetIndex);
    const point = meta.data[elRef.index];
    if (!point) return;

    const { x: px, y: py } = point;
    const scales = chart.scales;
    const yScale = scales.y;

    c.beginPath();
    c.setLineDash([3, 4]);
    c.strokeStyle = 'rgba(255,205,104,0.2)';
    c.lineWidth = 1;
    c.moveTo(px, yScale.top);
    c.lineTo(px, yScale.bottom);
    c.stroke();
    c.setLineDash([]);

    c.beginPath();
    c.arc(px, py, 5, 0, Math.PI * 2);
    c.fillStyle = ds._origColor ?? ds.borderColor;
    c.fill();
    c.beginPath();
    c.arc(px, py, 5, 0, Math.PI * 2);
    c.strokeStyle = '#1E1E1E';
    c.lineWidth = 2;
    c.stroke();
  }

  useEffect(() => {
    if (!skills.length || !Object.keys(categories).length || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let datasets: any[];

    if (viewMode === 'categories') {
      // Category averages view — 9 lines
      datasets = Object.entries(categories).map(([key, cat]) => {
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
          borderDash: [],
          pointRadius: 0,
          pointHoverRadius: 0,
          hitRadius: 15,
          tension: 0.35,
          clip: false,
          hidden: !activeCategories.has(key),
          _cat: key,
          _catLabel: cat.label,
          _catColor: cat.color,
          _origColor: cat.color,
          _origWidth: 3.5,
          _desc: `Average of ${catSkills.length} skills in ${cat.label}`,
        };
      });
    } else {
      // Individual skills view
      const siblings: Record<string, number> = {};
      skills.forEach(s => { siblings[s.category] = (siblings[s.category] || 0) + 1; });
      const idx: Record<string, number> = {};

      datasets = skills.map(skill => {
        const cat = skill.category;
        const catMeta = categories[cat] || { color: '#94a3b8', label: cat };
        const i = idx[cat] = (idx[cat] ?? -1) + 1;
        const total = siblings[cat];
        const color = skillColor(catMeta.color, i, total);
        const dash = DASH_PATTERNS[i % DASH_PATTERNS.length];
        const width = LINE_WIDTHS[i % LINE_WIDTHS.length];

        return {
          label: skill.name,
          data: YEARS.map(y => ({ x: y, y: skill.values[String(y)] ?? null })),
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: width,
          borderDash: dash,
          pointRadius: 0,
          pointHoverRadius: 0,
          hitRadius: 15,
          tension: 0.35,
          clip: false,
          hidden: !activeCategories.has(cat) || hiddenSkills.has(skill.name),
          _cat: cat,
          _catLabel: catMeta.label,
          _catColor: catMeta.color,
          _origColor: color,
          _origWidth: width,
          _desc: skill.description,
        } as any;
      });
    }

    const isMobileNow = window.matchMedia('(max-width: 768px)').matches;

    const eventLinesPlugin: Plugin = {
      id: 'eventLines',
      afterDraw(chart) {
        const { ctx: c, scales: { x, y } } = chart;
        c.save();

        const shortLabels: Record<number, string> = {
          1994: 'GoF Patterns',
          1999: 'Refactoring',
          2001: 'Agile',
          2005: 'Git',
          2008: 'GitHub',
          2014: 'Docker/K8s',
          2019: 'GH Actions',
          2022: 'ChatGPT',
        };
        keyEvents.forEach((ev, i) => {
          const px = x.getPixelForValue(ev.year);
          c.beginPath();
          c.setLineDash([4, 5]);
          c.strokeStyle = 'rgba(148,163,184,0.25)';
          c.lineWidth = 1.5;
          c.moveTo(px, y.top);
          c.lineTo(px, y.bottom);
          c.stroke();
          c.setLineDash([]);

          // Hide labels on mobile — too cramped
          if (!isMobileNow) {
            const rowOffset = (i % 2) * 16;
            const labelY = y.top - 28 + rowOffset;
            const short = shortLabels[ev.year] ?? ev.label;

            c.save();
            c.fillStyle = 'rgba(148,163,184,0.75)';
            c.font = '11px Inter, system-ui, sans-serif';
            c.textAlign = 'center';
            c.fillText(short, px, labelY);
            c.restore();
          }
        });

        c.restore();
      },
    };

    let lastHoveredIndex = -1;
    let lastPointIndex = -1;
    let activeElementRef: { datasetIndex: number; index: number } | null = null;

    function handleInteraction(chart: Chart, elements: any[]) {
      const hoveredIdx = elements.length ? elements[0].datasetIndex : -1;
      const hoveredPtIdx = elements.length ? elements[0].index : -1;

      if (hoveredIdx === lastHoveredIndex && hoveredPtIdx === lastPointIndex) return;

      const datasetChanged = hoveredIdx !== lastHoveredIndex;
      lastPointIndex = hoveredPtIdx;

      if (hoveredIdx === -1) {
        activeElementRef = null;
      } else {
        activeElementRef = { datasetIndex: elements[0].datasetIndex, index: hoveredPtIdx };
      }

      if (hoveredIdx === -1 && datasetChanged) {
        lastHoveredIndex = hoveredIdx;
        chart.data.datasets.forEach((ds: any) => {
          ds.borderColor = ds._origColor;
          ds.borderWidth = ds._origWidth;
        });
        setHoveredSkill(null);
        chart.update('none');
        drawOverlay(chart, null);
      } else if (hoveredIdx !== -1) {
        if (datasetChanged) {
          lastHoveredIndex = hoveredIdx;
          chart.data.datasets.forEach((ds: any, i: number) => {
            if (i === hoveredIdx) {
              ds.borderColor = ds._origColor;
              ds.borderWidth = 5;
            } else {
              ds.borderColor = ds._origColor;
              ds.borderWidth = ds._origWidth;
            }
          });
          chart.update('none');
        }
        drawOverlay(chart, activeElementRef);
        const hoveredDs = chart.data.datasets[hoveredIdx] as any;
        const pt = hoveredDs.data[hoveredPtIdx] as any;
        const year = pt ? Math.round(pt.x) : 0;
        const val = pt ? Number(pt.y) : 0;
        const info = {
          name: hoveredDs.label,
          catLabel: hoveredDs._catLabel,
          catColor: hoveredDs._catColor,
          desc: hoveredDs._desc,
          year,
          val,
        };
        setHoveredSkill(info);
      }
    }

    const config: ChartConfiguration = {
      type: 'line',
      plugins: [eventLinesPlugin],
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        clip: false,
        interaction: { mode: 'nearest', intersect: false },
        animation: { duration: 200 },
        layout: {
          padding: { right: 8, left: 4, top: isMobileNow ? 8 : 52, bottom: 4 },
        },
        scales: {
          x: {
            type: 'linear',
            min: 1970,
            max: 2031,
            ticks: {
              color: '#64748b',
              font: { size: isMobileNow ? 11 : 13 },
              stepSize: isMobileNow ? 10 : 5,
              callback: (v: any) => {
                const step = isMobileNow ? 10 : 5;
                return (Number.isInteger(v) && v % step === 0 && v <= 2026) ? String(v) : '';
              },
              maxRotation: 0,
            },
            afterFit(scale: any) { scale.paddingRight = isMobileNow ? 20 : 40; },
            grid: { color: 'rgba(58,58,58,0.8)' },
            border: { color: '#3a3a3a' },
          },
          y: {
            min: 0,
            max: 10,
            ticks: {
              color: '#64748b',
              font: { size: isMobileNow ? 11 : 13 },
              stepSize: isMobileNow ? 2 : 1,
              callback: (v: any) => {
                if (isMobileNow) return String(v);
                if (v === 5) return '5 – useful';
                if (v === 8) return '8 – expected';
                if (v === 10) return '10 – standard';
                return String(v);
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
          tooltip: { enabled: false },
        },
        onHover: isMobileNow ? undefined : (_event: any, elements: any[]) => {
          handleInteraction(chartRef.current!, elements);
        },
        onClick: (_event: any, elements: any[]) => {
          const chart = chartRef.current!;
          if (!elements.length) {
            setSelectedSkill(null);
            // Reset styles
            chart.data.datasets.forEach((ds: any) => {
              ds.borderColor = ds._origColor;
              ds.borderWidth = ds._origWidth;
            });
            chart.update('none');
            drawOverlay(chart, null);
            return;
          }
          handleInteraction(chart, elements);
          const el = elements[0];
          const ds = chart.data.datasets[el.datasetIndex] as any;
          const pt = ds.data[el.index] as any;
          setSelectedSkill({
            name: ds.label,
            catLabel: ds._catLabel,
            catColor: ds._catColor,
            desc: ds._desc,
            year: pt ? Math.round(pt.x) : 0,
            val: pt ? Number(pt.y) : 0,
          });
        },
      },
    };

    chartRef.current = new Chart(ctx, config);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [skills, categories, keyEvents, viewMode, isMobile]);

  // Sync hidden state when activeCategories or hiddenSkills changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (viewMode === 'categories') {
      chart.data.datasets.forEach((ds: any) => {
        ds.hidden = !activeCategories.has(ds._cat);
      });
    } else {
      chart.data.datasets.forEach((ds: any) => {
        ds.hidden = !activeCategories.has(ds._cat) || hiddenSkills.has(ds.label);
        ds.borderColor = ds._origColor;
        ds.borderWidth = ds._origWidth;
      });
    }
    chart.update('none');
    setHoveredSkill(null);
    setSelectedSkill(null);
    drawOverlay(chart, null);
  }, [activeCategories, hiddenSkills, viewMode]);

  const displayedSkill = selectedSkill ?? hoveredSkill;

  return (
    <div>
      {/* Scale legend */}
      {!isMobile && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '1rem' }}>
          {[
            { bg: '#475569', label: '0 – non-existent' },
            { bg: '#64748b', label: '5 – useful, not required' },
            { bg: '#94a3b8', label: '8 – expected of a senior' },
            { bg: '#F2F0E5', label: '10 – table-stakes standard' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#64748b' }}>
              <span style={{ display: 'inline-block', width: 28, height: 5, borderRadius: 3, background: item.bg, flexShrink: 0, lineHeight: 0, verticalAlign: 'middle' }} />
              {item.label}
            </div>
          ))}
        </div>
      )}

      <div
        style={{ position: 'relative', height: isMobile ? 320 : 560 }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedSkill(null); }}
      >
        <canvas ref={canvasRef} />
        <canvas ref={overlayRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />

        {/* Info badge — absolute on desktop, hidden on mobile (shown below instead) */}
        {!isMobile && displayedSkill && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(30,30,30,0.92)',
            border: `1px solid ${displayedSkill.catColor}55`,
            borderRadius: '0.6rem',
            padding: '0.55rem 0.9rem',
            pointerEvents: 'none',
            maxWidth: 260,
          }}>
            <div style={{
              fontFamily: 'Raleway, Arial Black, sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#F2F0E5',
              marginBottom: '0.15rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {displayedSkill.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: displayedSkill.catColor, fontWeight: 600, fontSize: '0.8rem' }}>
                {displayedSkill.catLabel}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>·</span>
              <span style={{ color: '#FFCD68', fontWeight: 700, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                {displayedSkill.year} → {displayedSkill.val.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile info badge — rendered in flow below chart */}
      {isMobile && displayedSkill && (
        <div style={{
          position: 'relative',
          marginTop: '0.5rem',
          background: 'rgba(30,30,30,0.92)',
          border: `1px solid ${displayedSkill.catColor}55`,
          borderRadius: '0.6rem',
          padding: '0.55rem 0.9rem',
        }}>
          <button
            onClick={() => setSelectedSkill(null)}
            style={{
              position: 'absolute', top: 4, right: 8,
              color: '#64748b', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
            }}
          >×</button>
          <div style={{
            fontFamily: 'Raleway, Arial Black, sans-serif',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: '#F2F0E5',
            marginBottom: '0.15rem',
            paddingRight: '1.5rem',
          }}>
            {displayedSkill.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: displayedSkill.catColor, fontWeight: 600, fontSize: '0.8rem' }}>
              {displayedSkill.catLabel}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>·</span>
            <span style={{ color: '#FFCD68', fontWeight: 700, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
              {displayedSkill.year} → {displayedSkill.val.toFixed(1)}
            </span>
          </div>
          <div style={{ color: '#94a3b8', lineHeight: 1.5, fontSize: '0.82rem', marginTop: '0.35rem' }}>
            {displayedSkill.desc}
          </div>
        </div>
      )}

      {/* Detail panel below chart — desktop only */}
      {!isMobile && (
        <div style={{
          marginTop: '0.75rem',
          minHeight: '4.5rem',
          background: displayedSkill ? '#252525' : 'transparent',
          border: displayedSkill ? '1px solid #3a3a3a' : '1px solid transparent',
          borderRadius: '0.75rem',
          padding: displayedSkill ? '0.85rem 1.2rem' : '0',
          transition: 'all 0.15s',
        }}>
          {displayedSkill && (
            <>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.3rem', fontFamily: 'Raleway, Arial Black, sans-serif', color: '#F2F0E5' }}>
                {displayedSkill.name}
                <span style={{ marginLeft: '0.6rem', fontSize: '0.85rem', fontWeight: 400, color: displayedSkill.catColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {displayedSkill.catLabel}
                </span>
              </div>
              <div style={{ color: '#94a3b8', lineHeight: 1.65, fontSize: '0.9rem' }}>
                {displayedSkill.desc}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
