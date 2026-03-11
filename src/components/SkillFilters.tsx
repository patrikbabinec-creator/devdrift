import { useState, useEffect } from 'react';
import SkillsChart from './SkillsChart';

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
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(ALL_KEYS)
  );
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set());
  const [skillsList, setSkillsList] = useState<SkillMeta[]>([]);
  // Sub-filter is hidden by default; user can open it or it opens when a category is toggled
  const [subFilterOpen, setSubFilterOpen] = useState(false);
  // Track if user has manually interacted with category filters (not "All")
  const [userFilteredCategories, setUserFilteredCategories] = useState(false);

  useEffect(() => {
    fetch('/data/skills-timeline.json')
      .then(r => r.json())
      .then(data => {
        setSkillsList(data.skills.map((s: any) => ({ name: s.name, category: s.category })));
      });
  }, []);

  function toggle(key: string) {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    // When toggling a category back on, unhide all its skills
    setHiddenSkills(prev => {
      const next = new Set(prev);
      const catSkills = skillsList.filter(s => s.category === key);
      catSkills.forEach(s => next.delete(s.name));
      return next;
    });
    // Open sub-filter when user clicks a specific category
    setUserFilteredCategories(true);
    setSubFilterOpen(true);
  }

  function selectAll() {
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
    setUserFilteredCategories(false);
    setSubFilterOpen(false);
  }

  function selectNone() {
    setActiveCategories(new Set());
    setHiddenSkills(new Set());
    setUserFilteredCategories(false);
    setSubFilterOpen(false);
  }

  function expandAll() {
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
    setUserFilteredCategories(true);
    setSubFilterOpen(true);
  }

  function toggleSkill(skillName: string) {
    setHiddenSkills(prev => {
      const next = new Set(prev);
      next.has(skillName) ? next.delete(skillName) : next.add(skillName);
      return next;
    });
  }

  // Compute visible skills for sub-filter: show only active categories that have >1 skill
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
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: '0.3rem 0.85rem',
    transition: 'opacity 0.15s, transform 0.1s',
    userSelect: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const subBtnBase: React.CSSProperties = {
    ...btnBase,
    fontSize: '0.8rem',
    padding: '0.2rem 0.65rem',
    fontWeight: 500,
  };

  return (
    <div>
      {/* Category filter controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: (subFilterOpen && hasSubFilterContent) ? '0.6rem' : '1.25rem',
      }}>
        <button
          onClick={selectAll}
          style={{
            ...btnBase,
            background: '#2e2e2e',
            borderColor: '#3a3a3a',
            color: '#94a3b8',
          }}
        >All</button>
        <button
          onClick={selectNone}
          style={{
            ...btnBase,
            background: '#2e2e2e',
            borderColor: '#3a3a3a',
            color: '#94a3b8',
          }}
        >None</button>
        <button
          onClick={expandAll}
          style={{
            ...btnBase,
            background: '#2e2e2e',
            borderColor: '#3a3a3a',
            color: '#94a3b8',
          }}
        >Expand All</button>

        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
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

      {/* Sub-filter: individual skills — only shown when opened */}
      {subFilterOpen && hasSubFilterContent && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.25rem',
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

      <SkillsChart activeCategories={activeCategories} hiddenSkills={hiddenSkills} />
    </div>
  );
}
