import { useState, useEffect } from 'react';
import SkillsChart from './SkillsChart';
import { useMediaQuery } from './useMediaQuery';

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

const ALL_KEYS = Object.keys(CATEGORIES);

interface SkillMeta {
  name: string;
  category: string;
}

export default function SkillFilters() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_KEYS));
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set());
  const [skillsList, setSkillsList] = useState<SkillMeta[]>([]);
  const [subFilterOpen, setSubFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'categories' | 'skills'>('categories');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetch('/data/skills-timeline.json')
      .then(r => r.json())
      .then(data => {
        setSkillsList(data.skills.map((s: any) => ({ name: s.name, category: s.category })));
      });
  }, []);

  function handleCategoryClick(key: string) {
    if (viewMode === 'categories') {
      // Drill down: show only this category's skills
      setViewMode('skills');
      setActiveCategories(new Set([key]));
      setHiddenSkills(new Set());
      setSubFilterOpen(true);
    } else {
      // Toggle category in skills view
      setActiveCategories(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
      setHiddenSkills(prev => {
        const next = new Set(prev);
        const catSkills = skillsList.filter(s => s.category === key);
        catSkills.forEach(s => next.delete(s.name));
        return next;
      });
      setSubFilterOpen(true);
    }
  }

  function backToOverview() {
    setViewMode('categories');
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
    setSubFilterOpen(false);
  }

  function selectAll() {
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
    setSubFilterOpen(false);
    setViewMode('categories');
  }

  function selectNone() {
    setActiveCategories(new Set());
    setHiddenSkills(new Set());
    setSubFilterOpen(false);
  }

  function expandAll() {
    setViewMode('skills');
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
    setSubFilterOpen(true);
  }

  function toggleSkill(skillName: string) {
    setHiddenSkills(prev => {
      const next = new Set(prev);
      next.has(skillName) ? next.delete(skillName) : next.add(skillName);
      return next;
    });
  }

  // Compute visible skills for sub-filter
  const visibleSkills = skillsList.filter(s => activeCategories.has(s.category));
  const catSkillCounts: Record<string, number> = {};
  visibleSkills.forEach(s => {
    catSkillCounts[s.category] = (catSkillCounts[s.category] || 0) + 1;
  });
  const subFilterSkills = visibleSkills.filter(s => catSkillCounts[s.category] > 1);
  const hasSubFilterContent = subFilterSkills.length > 0;

  const btnBase: React.CSSProperties = {
    border: '1.5px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: isMobile ? '0.82rem' : '0.9rem',
    fontWeight: 600,
    padding: isMobile ? '0.45rem 0.8rem' : '0.3rem 0.85rem',
    minHeight: isMobile ? 40 : 'auto',
    transition: 'opacity 0.15s, transform 0.1s',
    userSelect: 'none' as const,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const subBtnBase: React.CSSProperties = {
    ...btnBase,
    fontSize: isMobile ? '0.76rem' : '0.8rem',
    padding: isMobile ? '0.35rem 0.65rem' : '0.2rem 0.65rem',
    minHeight: isMobile ? 36 : 'auto',
    fontWeight: 500,
  };

  const utilBtnStyle: React.CSSProperties = {
    ...btnBase,
    background: '#2e2e2e',
    borderColor: '#3a3a3a',
    color: '#94a3b8',
  };

  return (
    <div>
      {/* View mode indicator + controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: isMobile ? '0.4rem' : '0.5rem',
        marginBottom: (viewMode === 'skills' && subFilterOpen && hasSubFilterContent) ? '0.6rem' : '1rem',
      }}>
        {viewMode === 'skills' && (
          <button
            onClick={backToOverview}
            style={{
              ...btnBase,
              background: '#FFCD6818',
              borderColor: '#FFCD68',
              color: '#FFCD68',
            }}
          >← Overview</button>
        )}

        <button onClick={selectAll} style={utilBtnStyle}>All</button>
        <button onClick={selectNone} style={utilBtnStyle}>None</button>
        <button onClick={expandAll} style={utilBtnStyle}>Expand All</button>

        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              style={{
                ...btnBase,
                background: isActive ? `${cat.color}1a` : 'transparent',
                borderColor: isActive ? cat.color : '#3a3a3a',
                color: isActive ? cat.color : '#64748b',
                opacity: isActive ? 1 : 0.45,
              }}
            >{cat.label}</button>
          );
        })}
      </div>

      {/* Sub-filter: individual skills — only in skills view */}
      {viewMode === 'skills' && subFilterOpen && hasSubFilterContent && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: isMobile ? '0.35rem' : '0.4rem',
          marginBottom: '1rem',
          paddingLeft: '0.2rem',
        }}>
          <span
            onClick={() => setSubFilterOpen(false)}
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginRight: '0.3rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Skills ▾
          </span>
          {subFilterSkills.map(skill => {
            const cat = CATEGORIES[skill.category];
            const isHidden = hiddenSkills.has(skill.name);
            return (
              <button
                key={skill.name}
                onClick={() => toggleSkill(skill.name)}
                style={{
                  ...subBtnBase,
                  background: isHidden ? 'transparent' : `${cat.color}12`,
                  borderColor: isHidden ? '#3a3a3a' : `${cat.color}88`,
                  color: isHidden ? '#64748b' : cat.color,
                  opacity: isHidden ? 0.4 : 0.85,
                }}
              >{skill.name}</button>
            );
          })}
        </div>
      )}

      <SkillsChart
        activeCategories={activeCategories}
        hiddenSkills={hiddenSkills}
        viewMode={viewMode}
      />
    </div>
  );
}
