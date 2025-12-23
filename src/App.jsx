import React, { useMemo, useState, useCallback } from 'react'
import { DeckGL } from '@deck.gl/react'
import { ScatterplotLayer, BitmapLayer } from '@deck.gl/layers'
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers'
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers'
import * as h3 from 'h3-js'

const INITIAL_VIEW_STATE = {
  longitude: -46.6333,
  latitude: -23.5505,
  zoom: 10,
  pitch: 45,
  bearing: 0
}

const SP_BOUNDS = {
  minLng: -47.06, maxLng: -46.30,
  minLat: -24.05, maxLat: -23.30,
  minZoom: 9, maxZoom: 16
}

const SAO_PAULO_BBOX = { south: -24.05, west: -47.06, north: -23.30, east: -46.30 }

const CAPITAL_DATA = [
  { name: 'São Paulo', position: [-46.6333, -23.5505], color: [0, 128, 255] },
  { name: 'Rio de Janeiro', position: [-43.1729, -22.9068], color: [65, 105, 225] },
  { name: 'Belo Horizonte', position: [-43.9345, -19.9167], color: [100, 149, 237] }
]

const MAP_STYLES = [
  { url: 'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png', labels: 'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png', label: 'Carto Voyager' },
  { url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png', labels: 'https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png', label: 'Carto Light' },
  { url: 'https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png', labels: 'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png', label: 'Carto Dark' },
  { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', labels: null, label: 'OpenStreetMap' }
]

const LAYER_MODES = [
  { value: 'scatter', label: '📍 Scatter (capitais)' },
  { value: 'hexagon', label: '⬡ Hexagon (agregação)' },
  { value: 'heatmap', label: '🔥 Heatmap (densidade)' },
  { value: 'h3', label: '🔷 H3 (capitais)' },
  { value: 'h3-bus', label: '🚌 H3 — Ônibus SP' }
]

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

function getStyles(collapsed) {
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

export default function App() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [mapStyleUrl, setMapStyleUrl] = useState(MAP_STYLES[0].url)
  const [layerMode, setLayerMode] = useState('scatter')
  const [hudCollapsed, setHudCollapsed] = useState(false)
  const [radiusPx, setRadiusPx] = useState(10)
  const [hexRadiusMeters, setHexRadiusMeters] = useState(15000)
  const [hexElevationScale, setHexElevationScale] = useState(50)
  const [h3Resolution, setH3Resolution] = useState(8)
  const [selectedHexes, setSelectedHexes] = useState(() => new Set())
  const [selectionConfirmed, setSelectionConfirmed] = useState(false)
  const [busStops, setBusStops] = useState([])
  const [loadingBus, setLoadingBus] = useState(false)
  const [busError, setBusError] = useState('')

  const handleHexClick = useCallback(({ object }) => {
    if (!object) return
    const hexId = object.hex || object.hexagon
    if (!hexId) return
    setSelectedHexes(prev => {
      const next = new Set(prev)
      next.has(hexId) ? next.delete(hexId) : next.add(hexId)
      return next
    })
  }, [])

  const handleRemoveHex = useCallback((hexId) => {
    setSelectedHexes(prev => {
      const next = new Set(prev)
      next.delete(hexId)
      return next
    })
    setSelectionConfirmed(false)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedHexes(new Set())
    setSelectionConfirmed(false)
  }, [])

  const handleMove = useCallback((evt) => {
    const next = evt.viewState
    setViewState(prev => {
      if (!prev) return next
      const clamped = {
        ...next,
        longitude: clamp(next.longitude, SP_BOUNDS.minLng, SP_BOUNDS.maxLng),
        latitude: clamp(next.latitude, SP_BOUNDS.minLat, SP_BOUNDS.maxLat),
        zoom: clamp(next.zoom, SP_BOUNDS.minZoom, SP_BOUNDS.maxZoom)
      }
      if (prev.longitude === clamped.longitude && prev.latitude === clamped.latitude &&
          prev.zoom === clamped.zoom && prev.pitch === clamped.pitch && prev.bearing === clamped.bearing) {
        return prev
      }
      return clamped
    })
  }, [])

  const fetchBusStops = useCallback(async () => {
    setLoadingBus(true)
    setBusError('')
    try {
      const query = `[out:json];(node["highway"="bus_stop"](${SAO_PAULO_BBOX.south},${SAO_PAULO_BBOX.west},${SAO_PAULO_BBOX.north},${SAO_PAULO_BBOX.east}););out body;`
      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ data: query })
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = await resp.json()
      const pts = (json.elements || [])
        .filter(el => el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number')
        .map(el => ({ position: [el.lon, el.lat], name: el.tags?.name || 'Ponto de ônibus' }))
      setBusStops(pts)
    } catch (err) {
      setBusError(err.message || String(err))
    } finally {
      setLoadingBus(false)
    }
  }, [])

  const getTooltip = useCallback(({ object }) => {
    if (!object) return null
    if (!object.position) return object.name || null
    const [lng, lat] = object.position
    return `${object.name || 'Ponto'}\n(${lat.toFixed(4)}, ${lng.toFixed(4)})`
  }, [])

  const data = useMemo(() => CAPITAL_DATA, [])

  const assetsWithH3 = useMemo(() => 
    data.map(d => ({ ...d, h3index: h3.latLngToCell(d.position[1], d.position[0], h3Resolution) })), 
  [data, h3Resolution])

  const uniqueH3 = useMemo(() => [...new Set(assetsWithH3.map(a => a.h3index))], [assetsWithH3])

  const busStopsWithHex = useMemo(() => 
    busStops.map(p => ({ ...p, h3index: h3.latLngToCell(p.position[1], p.position[0], h3Resolution) })), 
  [busStops, h3Resolution])

  const selectedBusStops = useMemo(() => {
    if (selectedHexes.size === 0) return []
    return busStopsWithHex.filter(p => selectedHexes.has(p.h3index))
  }, [busStopsWithHex, selectedHexes])

  const busStopsByHex = useMemo(() => {
    const counts = new Map()
    busStopsWithHex.forEach(p => counts.set(p.h3index, (counts.get(p.h3index) || 0) + 1))
    return counts
  }, [busStopsWithHex])

  const busHexData = useMemo(() => 
    Array.from(busStopsByHex.entries()).map(([hex, count]) => ({ hex, count })), 
  [busStopsByHex])

  const selectedHexesArray = useMemo(() => [...selectedHexes], [selectedHexes])
  const styles = useMemo(() => getStyles(hudCollapsed), [hudCollapsed])

  const scatterLayer = useMemo(() => new ScatterplotLayer({
    id: 'capitals-scatter',
    data,
    getPosition: d => d.position,
    getRadius: radiusPx,
    getFillColor: d => d.color,
    radiusUnits: 'pixels',
    pickable: true,
    autoHighlight: true
  }), [data, radiusPx])

  const hexLayer = useMemo(() => new HexagonLayer({
    id: 'capitals-hex',
    data: data.map(d => d.position),
    getPosition: p => p,
    radius: hexRadiusMeters,
    elevationScale: hexElevationScale,
    extruded: true,
    coverage: 0.9,
    pickable: true
  }), [data, hexRadiusMeters, hexElevationScale])

  const h3Layer = useMemo(() => new H3HexagonLayer({
    id: 'capitals-h3',
    data: uniqueH3,
    getHexagon: h => h,
    stroked: true,
    filled: true,
    extruded: true,
    elevationScale: hexElevationScale,
    getFillColor: [0, 128, 255, 80],
    getLineColor: [0, 200, 255, 255],
    lineWidthMinPixels: 2,
    pickable: true,
    onClick: handleHexClick
  }), [uniqueH3, hexElevationScale, handleHexClick])

  const h3BusLayer = useMemo(() => new H3HexagonLayer({
    id: 'sp-bus-h3',
    data: selectionConfirmed ? busHexData.filter(d => selectedHexes.has(d.hex)) : busHexData,
    getHexagon: d => d.hex,
    extruded: true,
    stroked: true,
    filled: true,
    getElevation: d => (selectionConfirmed && selectedHexes.has(d.hex)) ? 0 : d.count * 15,
    elevationScale: 1,
    getFillColor: d => {
      if (selectedHexes.has(d.hex)) return selectionConfirmed ? [0, 220, 255, 40] : [0, 220, 255, 120]
      return [255, Math.max(50, 255 - d.count * 3), 0, 180]
    },
    getLineColor: d => selectedHexes.has(d.hex) ? [0, 255, 255, 255] : [40, 40, 40, 200],
    lineWidthMinPixels: 2,
    pickable: !selectionConfirmed,
    onClick: handleHexClick,
    updateTriggers: {
      getFillColor: [selectedHexesArray, selectionConfirmed],
      getLineColor: selectedHexesArray,
      getElevation: [selectedHexesArray, selectionConfirmed]
    }
  }), [busHexData, selectedHexes, selectedHexesArray, selectionConfirmed, handleHexClick])

  const selectedStopsLayer = useMemo(() => new ScatterplotLayer({
    id: 'selected-bus-stops',
    data: selectionConfirmed ? selectedBusStops : [],
    getPosition: d => d.position,
    getRadius: 4,
    getFillColor: [255, 80, 80, 255],
    getLineColor: [255, 255, 255, 255],
    stroked: true,
    lineWidthMinPixels: 1,
    radiusUnits: 'pixels',
    pickable: true,
    autoHighlight: true
  }), [selectedBusStops, selectionConfirmed])

  const heatLayer = useMemo(() => new HeatmapLayer({
    id: 'capitals-heat',
    data,
    getPosition: d => d.position,
    getWeight: 1,
    radiusPixels: Math.max(radiusPx, 8)
  }), [data, radiusPx])

  const basemapLayer = useMemo(() => new TileLayer({
    id: 'basemap',
    data: mapStyleUrl,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 512,
    refinementStrategy: 'no-overlap',
    renderSubLayers: props => {
      const { boundingBox } = props.tile
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
      })
    }
  }), [mapStyleUrl])

  const selectedStyle = MAP_STYLES.find(s => s.url === mapStyleUrl)
  const labelsUrl = selectedStyle?.labels

  const labelsLayer = useMemo(() => labelsUrl ? new TileLayer({
    id: 'labels',
    data: labelsUrl,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 512,
    refinementStrategy: 'no-overlap',
    renderSubLayers: props => {
      const { boundingBox } = props.tile
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
        parameters: { depthTest: false }
      })
    }
  }) : null, [labelsUrl])

  const layers = useMemo(() => {
    let dataLayers
    switch (layerMode) {
      case 'scatter': dataLayers = [scatterLayer]; break
      case 'hexagon': dataLayers = [hexLayer]; break
      case 'heatmap': dataLayers = [heatLayer]; break
      case 'h3': dataLayers = [h3Layer]; break
      case 'h3-bus': dataLayers = [h3BusLayer, selectedStopsLayer]; break
      default: dataLayers = [scatterLayer]
    }
    return [basemapLayer, ...dataLayers, labelsLayer].filter(Boolean)
  }, [layerMode, basemapLayer, labelsLayer, scatterLayer, hexLayer, heatLayer, h3Layer, h3BusLayer, selectedStopsLayer])

  return (
    <div style={{ height: '100%', position: 'relative', userSelect: 'none' }}>
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
              <label style={styles.label}>Visualização</label>
              <select value={layerMode} onChange={e => setLayerMode(e.target.value)} style={styles.select}>
                {LAYER_MODES.map(({ value, label }) => <option key={value} style={styles.option} value={value}>{label}</option>)}
              </select>
            </div>

            {(layerMode === 'scatter' || layerMode === 'heatmap') && (
              <div style={styles.section}>
                <label style={styles.label}>Raio: {radiusPx}px</label>
                <input type="range" min={4} max={40} value={radiusPx} onChange={e => setRadiusPx(+e.target.value)} style={styles.slider} />
              </div>
            )}

            {layerMode === 'hexagon' && (
              <div style={styles.section}>
                <label style={styles.label}>Hex Radius: {(hexRadiusMeters / 1000).toFixed(0)}km</label>
                <input type="range" min={5000} max={40000} step={1000} value={hexRadiusMeters} onChange={e => setHexRadiusMeters(+e.target.value)} style={styles.slider} />
                <label style={{ ...styles.label, marginTop: 8 }}>Elevação: {hexElevationScale}</label>
                <input type="range" min={5} max={200} step={5} value={hexElevationScale} onChange={e => setHexElevationScale(+e.target.value)} style={styles.slider} />
              </div>
            )}

            {layerMode === 'h3' && (
              <div style={styles.section}>
                <label style={styles.label}>H3 Resolution: {h3Resolution}</label>
                <input type="range" min={6} max={10} step={1} value={h3Resolution} onChange={e => setH3Resolution(+e.target.value)} style={styles.slider} />
                <label style={{ ...styles.label, marginTop: 8 }}>Elevação: {hexElevationScale}</label>
                <input type="range" min={5} max={200} step={5} value={hexElevationScale} onChange={e => setHexElevationScale(+e.target.value)} style={styles.slider} />
              </div>
            )}

            {layerMode === 'h3-bus' && (
              <>
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
              </>
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

      <DeckGL
        layers={layers}
        controller={{ doubleClickZoom: false, dragRotate: true, touchRotate: true, keyboard: true, scrollZoom: true, dragPan: true, inertia: false }}
        viewState={viewState}
        onViewStateChange={handleMove}
        getTooltip={getTooltip}
        onContextMenu={e => e.preventDefault()}
        style={{ background: '#0a0a0f' }}
        useDevicePixels={true}
      />
    </div>
  )
}
