// ============================================================
// QUEZ APP LITE — DrinkGuide.jsx
// Session 9: Drink Build Guide
// Quick-reference recipe cards for all 15 menu drinks.
// Accessible to all roles.
// ============================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { drinkRecipes, DRINK_CATEGORIES, PREP_TYPE_COLORS } from '../data/drinkRecipes';

const PREP_LABELS = {
  hot:     { en: 'Hot',     es: 'Caliente' },
  iced:    { en: 'Iced',    es: 'Frío' },
  blended: { en: 'Blended', es: 'Licuado' },
};

export default function DrinkGuide() {
  const { language } = useApp();
  const lang = language || 'en';

  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);   // drink id currently open
  const [sizeTab, setSizeTab]     = useState({});      // { drinkId: '12oz'|'16oz' }
  const [prepTab, setPrepTab]     = useState({});      // { drinkId: 'hot'|'iced'|'blended' }

  const getSize = (id) => sizeTab[id] || '12oz';
  const getPrep = (drink) => {
    if (prepTab[drink.id]) return prepTab[drink.id];
    if (drink.buildSteps.hot)     return 'hot';
    if (drink.buildSteps.iced)    return 'iced';
    return 'blended';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return drinkRecipes.filter((d) => d.name.toLowerCase().includes(q));
  }, [search]);

  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  const renderCard = (drink) => {
    const size  = getSize(drink.id);
    const prep  = getPrep(drink);
    const preps = Object.keys(drink.buildSteps);
    const ingredients = drink.ingredients[size] || [];
    const steps       = drink.buildSteps[prep]  || [];

    return (
      <div style={S.recipeCard}>
        {/* Size + prep tabs */}
        <div style={S.tabRow}>
          {['12oz', '16oz'].map((s) => (
            <button
              key={s}
              style={{ ...S.tabBtn, ...(size === s ? S.tabBtnActive : {}) }}
              onClick={(e) => { e.stopPropagation(); setSizeTab((p) => ({ ...p, [drink.id]: s })); }}
            >
              {s}
            </button>
          ))}
          {preps.length > 1 && (
            <div style={S.tabSpacer} />
          )}
          {preps.length > 1 && preps.map((p) => {
            const isActive = prep === p;
            const activeStyle = isActive ? (S.prepActiveByType[p] || S.tabBtnActivePrep) : {};
            return (
              <button
                key={p}
                style={{ ...S.tabBtn, ...activeStyle }}
                onClick={(e) => { e.stopPropagation(); setPrepTab((pv) => ({ ...pv, [drink.id]: p })); }}
              >
                {PREP_LABELS[p]?.[lang] || p}
              </button>
            );
          })}
        </div>

        {/* Ingredients */}
        <div style={S.block}>
          <div style={S.blockLabel}>
            {lang === 'es' ? 'Ingredientes' : 'Ingredients'}
          </div>
          {ingredients.map((ing, i) => (
            <div key={i} style={S.ingredient}>
              <span style={S.bullet}>·</span>
              <span>{ing}</span>
            </div>
          ))}
        </div>

        {/* Build steps */}
        <div style={S.block}>
          <div style={S.blockLabel}>
            {lang === 'es' ? 'Pasos de Preparación' : 'Build Steps'}
          </div>
          {steps.map((step, i) => (
            <div key={i} style={S.step}>
              <span style={S.stepNum}>{i + 1}</span>
              <span style={S.stepText}>{step}</span>
            </div>
          ))}
        </div>

        {/* Build time */}
        <div style={S.metaRow}>
          <span style={S.timeBadge}>⏱ {drink.buildTime}</span>
        </div>

        {/* Tip */}
        {drink.tip && (
          <div style={S.tip}>
            <span style={S.tipIcon}>💡</span>
            <span>{drink.tip}</span>
          </div>
        )}
      </div>
    );
  };

  const renderDrinkRow = (drink) => {
    const isOpen = expanded === drink.id;
    return (
      <div key={drink.id} style={S.drinkRow}>
        <button style={S.drinkHeader} onClick={() => toggleExpand(drink.id)}>
          <div style={S.drinkMeta}>
            <span style={S.drinkName}>{drink.name}</span>
            <span style={{ ...S.prepBadge, color: PREP_TYPE_COLORS[drink.prepType] || '#888' }}>
              {drink.prepType}
            </span>
          </div>
          <span style={{ color: isOpen ? '#D4AF37' : '#555', fontSize: 13, flexShrink: 0 }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
        {isOpen && renderCard(drink)}
      </div>
    );
  };

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>
          {lang === 'es' ? 'Guía de Bebidas' : 'Drink Build Guide'}
        </div>
        <div style={S.headerSub}>
          {lang === 'es' ? 'Recetas de referencia rápida · 15 bebidas' : 'Quick-reference recipes · 15 drinks'}
        </div>
      </div>

      {/* Search */}
      <div style={S.searchWrap}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setExpanded(null); }}
          placeholder={lang === 'es' ? 'Buscar bebida...' : 'Search drinks...'}
          style={S.searchInput}
        />
        {search.trim() && (
          <button style={S.clearBtn} onClick={() => { setSearch(''); setExpanded(null); }}>✕</button>
        )}
      </div>

      {/* Content */}
      <div style={S.body}>
        {filtered !== null ? (
          filtered.length === 0 ? (
            <div style={S.empty}>
              {lang === 'es' ? 'Sin resultados.' : 'No drinks found.'}
            </div>
          ) : (
            filtered.map((d) => renderDrinkRow(d))
          )
        ) : (
          DRINK_CATEGORIES.map(({ key, label }) => {
            const drinks = drinkRecipes.filter((d) => d.category === key);
            if (!drinks.length) return null;
            return (
              <div key={key}>
                <div style={S.catHeader}>{label[lang]}</div>
                {drinks.map((d) => renderDrinkRow(d))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  screen: {
    backgroundColor: '#0D0D0D',
    minHeight: '100vh',
    color: '#F5F0E8',
    fontFamily: 'Georgia, serif',
    paddingBottom: 100,
  },
  header: {
    padding: '20px 20px 14px',
    borderBottom: '1px solid rgba(212,175,55,0.2)',
    background: '#1A1A1A',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: {
    fontSize: 11,
    letterSpacing: '0.12em',
    color: '#D4AF37',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    color: '#D4AF37',
    letterSpacing: '0.02em',
  },
  headerSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
    letterSpacing: '0.06em',
  },
  searchWrap: {
    padding: '12px 16px',
    background: '#111',
    borderBottom: '1px solid rgba(212,175,55,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    background: '#1A1A1A',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 8,
    color: '#F5F0E8',
    fontFamily: 'Georgia, serif',
    fontSize: 15,
    padding: '9px 13px',
    outline: 'none',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  body: {
    padding: '0 0 20px',
  },
  catHeader: {
    padding: '14px 18px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#D4AF37',
    borderBottom: '1px solid rgba(212,175,55,0.15)',
    marginTop: 8,
  },
  drinkRow: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  drinkHeader: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#F5F0E8',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    padding: '13px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    gap: 12,
  },
  drinkMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  drinkName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#F5F0E8',
  },
  prepBadge: {
    fontSize: 11,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.04em',
  },
  // Recipe card
  recipeCard: {
    background: '#161616',
    borderTop: '1px solid rgba(212,175,55,0.12)',
    padding: '14px 18px 18px',
  },
  tabRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabSpacer: {
    flex: 1,
  },
  tabBtn: {
    background: '#2A2A2A',
    border: '1px solid #333',
    borderRadius: 6,
    color: '#888',
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    padding: '5px 12px',
    cursor: 'pointer',
  },
  tabBtnActive: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
  },
  tabBtnActivePrep: {
    background: 'rgba(123,179,240,0.12)',
    border: '1px solid #7BB3F0',
    color: '#7BB3F0',
  },
  prepActiveByType: {
    hot: {
      background: 'rgba(240,123,123,0.14)',
      border: '1px solid #F07B7B',
      color: '#F07B7B',
    },
    iced: {
      background: 'rgba(123,179,240,0.12)',
      border: '1px solid #7BB3F0',
      color: '#7BB3F0',
    },
    blended: {
      background: 'rgba(179,123,240,0.14)',
      border: '1px solid #B37BF0',
      color: '#B37BF0',
    },
  },
  block: {
    marginBottom: 16,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'system-ui, sans-serif',
  },
  ingredient: {
    display: 'flex',
    gap: 8,
    fontSize: 14,
    color: '#ddd',
    marginBottom: 5,
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.4,
  },
  bullet: {
    color: '#D4AF37',
    flexShrink: 0,
  },
  step: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
    fontFamily: 'system-ui, sans-serif',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: 700,
  },
  stepText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 1.5,
    paddingTop: 2,
  },
  metaRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  timeBadge: {
    fontSize: 12,
    color: '#888',
    background: '#222',
    border: '1px solid #333',
    borderRadius: 5,
    padding: '3px 9px',
    fontFamily: 'system-ui, sans-serif',
  },
  tip: {
    display: 'flex',
    gap: 8,
    background: 'rgba(212,175,55,0.07)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 8,
    padding: '10px 13px',
    marginTop: 8,
    fontSize: 13,
    color: '#ccc',
    lineHeight: 1.5,
    fontFamily: 'system-ui, sans-serif',
  },
  tipIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    padding: '60px 20px',
    fontSize: 15,
    fontFamily: 'system-ui, sans-serif',
  },
};
