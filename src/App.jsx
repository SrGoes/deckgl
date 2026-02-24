import React, { useMemo, useState, useCallback } from 'react'
import { DeckGL } from '@deck.gl/react'
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers'
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers'
import { useBusStops } from './hooks/useBusStops'
import { useMapSelection } from './hooks/useMapSelection'
import HudPanel from './components/HudPanel'

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

const MAP_STYLES = [
  {
    url: 'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png',
    labels: 'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png',
    label: 'Carto Voyager'
  },
  {
    url: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
    labels: 'https://basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}@2x.png',
    label: 'Carto Light'
  },
  {
    url: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
    labels: 'https://basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png',
    label: 'Carto Dark'
  },
  {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    labels: null,
    label: 'OpenStreetMap'
  }
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
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [h3Resolution, setH3Resolution] = useState(8);

  // Hook para pontos de ônibus
  const {
    busStops,
    loadingBus,
    busError,
    fetchBusStops,
    busStopsWithHex
  } = useBusStops(h3Resolution)

  // Hook para seleção de hexágonos
  const {
    selectedHexes,
    setSelectedHexes,
    selectionConfirmed,
    setSelectionConfirmed,
    handleHexClick,
    handleRemoveHex,
    handleClearSelection,
    selectedHexesArray,
    selectedBusStops
  } = useMapSelection(h3Resolution, busStopsWithHex)

  const handleMove = React.useCallback((evt) => {
    const next = evt.viewState;
    setViewState(prev => {
      if (!prev) return next;
      const clamped = {
        ...next,
        longitude: clamp(next.longitude, SP_BOUNDS.minLng, SP_BOUNDS.maxLng),
        latitude: clamp(next.latitude, SP_BOUNDS.minLat, SP_BOUNDS.maxLat),
        zoom: clamp(next.zoom, SP_BOUNDS.minZoom, SP_BOUNDS.maxZoom)
      };
      if (
        prev.longitude === clamped.longitude &&
        prev.latitude === clamped.latitude &&
        prev.zoom === clamped.zoom &&
        prev.pitch === clamped.pitch &&
        prev.bearing === clamped.bearing
      ) {
        return prev;
      }
      return clamped;
    });
  }, []);



  const getTooltip = useCallback(({ object }) => {
    if (!object) return null
    if (!object.position) return object.name || null
    const [lng, lat] = object.position
    return `${object.name || 'Ponto'}\n(${lat.toFixed(4)}, ${lng.toFixed(4)})`
  }, [])




  const busStopsByHex = useMemo(() => {
    const counts = new Map()
    busStopsWithHex.forEach(p => counts.set(p.h3index, (counts.get(p.h3index) || 0) + 1))
    return counts
  }, [busStopsWithHex])

  const busHexData = useMemo(() => 
    Array.from(busStopsByHex.entries()).map(([hex, count]) => ({ hex, count })), 
  [busStopsByHex])


  const styles = useMemo(() => getStyles(hudCollapsed), [hudCollapsed])

  // Layer para exibir pontos de ônibus selecionados
  const selectedStopsLayer = useMemo(() =>
    selectionConfirmed && selectedBusStops.length > 0
      ? new ScatterplotLayer({
          id: 'selected-bus-stops',
          data: selectedBusStops,
          getPosition: d => d.position,
          getRadius: 4,
          getFillColor: [255, 80, 80, 255],
          getLineColor: [255, 255, 255, 255],
          stroked: true,
          lineWidthMinPixels: 1,
          radiusUnits: 'pixels',
          pickable: true,
          autoHighlight: true
        })
      : null,
    [selectedBusStops, selectionConfirmed]
  );

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

  const basemapLayer = useMemo(() => new TileLayer({
    id: 'basemap',
    data: mapStyleUrl,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 512,
    refinementStrategy: 'no-overlap',
    renderSubLayers: props => {
      const { boundingBox } = props.tile;
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
      });
    }
  }), [mapStyleUrl]);

  const layers = useMemo(() => {
    return [basemapLayer, h3BusLayer, selectedStopsLayer, labelsLayer].filter(Boolean);
  }, [basemapLayer, h3BusLayer, selectedStopsLayer, labelsLayer]);

  return (
    <div style={{ height: '100%', position: 'relative', userSelect: 'none' }}>
      <HudPanel
        styles={styles}
        hudCollapsed={hudCollapsed}
        setHudCollapsed={setHudCollapsed}
        viewState={viewState}
        setViewState={setViewState}
        mapStyleUrl={mapStyleUrl}
        setMapStyleUrl={setMapStyleUrl}
        h3Resolution={h3Resolution}
        setH3Resolution={setH3Resolution}
        loadingBus={loadingBus}
        fetchBusStops={fetchBusStops}
        busError={busError}
        busStops={busStops}
        busHexData={busHexData}
        selectionConfirmed={selectionConfirmed}
        selectedHexes={selectedHexes}
        selectedHexesArray={selectedHexesArray}
        selectedBusStops={selectedBusStops}
        handleRemoveHex={handleRemoveHex}
        handleClearSelection={handleClearSelection}
        setSelectionConfirmed={setSelectionConfirmed}
        MAP_STYLES={MAP_STYLES}
      />

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