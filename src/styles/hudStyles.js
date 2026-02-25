// src/styles/hudStyles.js
export function getStyles(collapsed) {
  return {
    hud: {
      position: 'absolute',
      top: 16, right: 16,
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(12px)',
      padding: collapsed ? '12px 16px' : '16px 20px',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 2,
      minWidth: collapsed ? 'auto' : 280,
      maxWidth: 320,
      color: '#e2e8f0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 13,
      transition: 'all 0.2s ease'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: collapsed ? 0 : 12,
      paddingBottom: collapsed ? 0 : 10,
      borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.1)'
    },
    title: { fontWeight: 600, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
    collapseBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: 6,
      fontSize: 12
    },
    section: { marginBottom: 14 },
    label: { display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
    select: {
      width: '100%',
      padding: '8px 12px',
      background: '#1e293b',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 8,
      color: '#fff',
      fontSize: 13,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center'
    },
    option: { background: '#1e293b', color: '#fff', padding: '8px' },
    slider: { width: '100%', accentColor: '#06b6d4', cursor: 'pointer' },
    btn: {
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      border: 'none',
      borderRadius: 8,
      color: '#fff',
      fontWeight: 500,
      fontSize: 13,
      cursor: 'pointer',
      width: '100%',
      boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
    },
    btnDisabled: { background: 'rgba(255,255,255,0.1)', boxShadow: 'none', cursor: 'wait' },
    stats: { display: 'flex', gap: 12, marginTop: 10 },
    stat: { flex: 1, background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 8, textAlign: 'center' },
    statValue: { fontSize: 18, fontWeight: 600, color: '#06b6d4' },
    statLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
    selection: {
      marginTop: 12,
      padding: 12,
      background: 'rgba(6, 182, 212, 0.15)',
      borderRadius: 8,
      border: '1px solid rgba(6, 182, 212, 0.3)',
      maxHeight: 200,
      overflowY: 'auto'
    },
    hexItem: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 11, color: '#cbd5e1' },
    removeBtn: { background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 10 },
    clearBtn: {
      marginTop: 8,
      padding: '6px 12px',
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 6,
      color: '#f87171',
      fontSize: 11,
      cursor: 'pointer'
    },
    footer: { marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 10, color: '#64748b' },
    techBadge: { display: 'inline-block', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginRight: 4, marginBottom: 4, fontSize: 9 }
  }
}
