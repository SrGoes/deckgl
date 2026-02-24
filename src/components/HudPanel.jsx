import React from 'react'

export default function HudPanel({
  styles,
  hudCollapsed,
  setHudCollapsed,
  viewState,
  setViewState,
  mapStyleUrl,
  setMapStyleUrl,
  layerMode,
  setLayerMode,
  hexRadiusMeters,
  setHexRadiusMeters,
  hexElevationScale,
  setHexElevationScale,
  h3Resolution,
  setH3Resolution,
  loadingBus,
  fetchBusStops,
  busError,
  busStops,
  busHexData,
  selectionConfirmed,
  selectedHexes,
  selectedHexesArray,
  selectedBusStops,
  handleRemoveHex,
  handleClearSelection,
  setSelectionConfirmed,
  MAP_STYLES,
  LAYER_MODES
}) {
  return (
    <div style={styles.hud}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span>🗺️</span>
          <span>Deck.gl Explorer</span>
        </div>
        <button style={styles.collapseBtn} onClick={() => setHudCollapsed(!hudCollapsed)} type="button">
          {hudCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!hudCollapsed && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Câmera</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Pitch {Math.round(viewState.pitch)}°</span>
                <input type="range" min={0} max={60} value={viewState.pitch} onChange={e => setViewState(v => ({ ...v, pitch: +e.target.value }))} style={styles.slider} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Bearing {Math.round(viewState.bearing)}°</span>
                <input type="range" min={-180} max={180} value={viewState.bearing} onChange={e => setViewState(v => ({ ...v, bearing: +e.target.value }))} style={styles.slider} />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Base do Mapa</label>
            <select value={mapStyleUrl} onChange={e => setMapStyleUrl(e.target.value)} style={styles.select}>
              {MAP_STYLES.map(({ url, label }) => <option key={url} style={styles.option} value={url}>{label}</option>)}
            </select>
          </div>

          <div style={styles.section}>
            <button type="button" onClick={fetchBusStops} disabled={loadingBus} style={{ ...styles.btn, ...(loadingBus ? styles.btnDisabled : {}) }}>
              {loadingBus ? '⏳ Carregando...' : '🚌 Carregar Pontos de Ônibus'}
            </button>
            {busError && <div style={{ color: '#f87171', fontSize: 11, marginTop: 6 }}>⚠️ {busError}</div>}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>H3 Resolution: {h3Resolution}</label>
            <input type="range" min={6} max={10} step={1} value={h3Resolution} onChange={e => setH3Resolution(+e.target.value)} style={styles.slider} />
          </div>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{busStops.length.toLocaleString()}</div>
              <div style={styles.statLabel}>Paradas</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{busHexData.length.toLocaleString()}</div>
              <div style={styles.statLabel}>Hexágonos</div>
            </div>
          </div>

          {selectedHexes.size > 0 && (
            <div style={styles.selection}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: selectionConfirmed ? '#22c55e' : '#06b6d4' }}>
                {selectionConfirmed ? '✅' : '✓'} {selectedHexes.size} hex{selectedHexes.size > 1 ? 'es' : ''} selecionado{selectedHexes.size > 1 ? 's' : ''}
                {selectionConfirmed && ' (confirmado)'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>🚏 {selectedBusStops.length} pontos de ônibus</div>
              {!selectionConfirmed && selectedHexesArray.slice(0, 5).map(hexId => (
                <div key={hexId} style={styles.hexItem}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace', fontSize: 10 }}>{hexId}</span>
                  <button type="button" onClick={() => handleRemoveHex(hexId)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
              {!selectionConfirmed && selectedHexes.size > 5 && (
                <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>+{selectedHexes.size - 5} mais</div>
              )}
              {!selectionConfirmed ? (
                <button type="button" onClick={() => setSelectionConfirmed(true)} style={{ ...styles.clearBtn, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', fontWeight: 600 }}>
                  ✓ Confirmar seleção
                </button>
              ) : (
                <button type="button" onClick={handleClearSelection} style={styles.clearBtn}>🗑️ Nova seleção</button>
              )}
            </div>
          )}

          <div style={styles.footer}>
            <div style={{ marginBottom: 6, color: '#94a3b8' }}>Construído com</div>
            <div>
              <span style={styles.techBadge}>⚛️ React</span>
              <span style={styles.techBadge}>🗺️ Deck.gl</span>
              <span style={styles.techBadge}>⬡ H3</span>
              <span style={styles.techBadge}>⚡ Vite</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: '#475569' }}>Dados: OpenStreetMap via Overpass API</div>
          </div>
        </>
      )}
    </div>

  );
}
