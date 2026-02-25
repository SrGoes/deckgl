import React, { useMemo, useState, useCallback } from 'react'
import { FlyToInterpolator, WebMercatorViewport } from '@deck.gl/core'
import { DeckGL } from '@deck.gl/react'
import { useBusStops } from './hooks/useBusStops'
import { useMapSelection } from './hooks/useMapSelection'
import { useLayerFactory } from './hooks/useLayerFactory'
import HudPanel from './components/HudPanel'
import CtrlController from './controllers/CtrlController'
import { getStyles } from './styles/hudStyles'
import { INITIAL_VIEW_STATE, SP_BOUNDS, MAP_STYLES, MAP_CONTROLLER_CONFIG } from './constants/mapConstants'

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

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

  const handleMove = useCallback((evt) => {
    const next = evt.viewState;
    setViewState(prev => {
      if (!prev) return next;
      const clamped = {
        ...next,
        longitude: clamp(next.longitude, SP_BOUNDS.minLng, SP_BOUNDS.maxLng),
        latitude: clamp(next.latitude, SP_BOUNDS.minLat, SP_BOUNDS.maxLat),
        zoom: clamp(next.zoom, SP_BOUNDS.minZoom, SP_BOUNDS.maxZoom),
        transitionDuration: 0, // Remove qualquer transição ativa
        transitionInterpolator: null
      };

      const hasTransition = prev.transitionDuration && prev.transitionDuration > 0;

      if (
        !hasTransition && // Só evita atualização se NÃO houver transição para limpar
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

  const handleConfirmSelection = useCallback((isConfirmed) => {
    setSelectionConfirmed(isConfirmed)

    if (isConfirmed && selectedBusStops.length > 0) {
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90
      
      for (const stop of selectedBusStops) {
        const [lng, lat] = stop.position
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }

      if (minLng < maxLng && minLat < maxLat) {
        const viewport = new WebMercatorViewport({
          width: window.innerWidth,
          height: window.innerHeight
        })

        const { longitude, latitude, zoom } = viewport.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 60 }
        )

        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          zoom: Math.min(zoom, 16), // Limita o zoom máximo para não ficar muito perto
          transitionDuration: 1500,
          transitionInterpolator: new FlyToInterpolator()
        }))
      }
    }
  }, [selectedBusStops, setSelectionConfirmed])

  const handleClearAndResetView = useCallback(() => {
    handleClearSelection();
    setViewState(prev => ({
      ...INITIAL_VIEW_STATE,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }));
  }, [handleClearSelection]);


  const getTooltip = useCallback(({ object }) => {
    if (!object) return null
    if (object.hex) {
      return `Hexágono: ${object.hex}\nParadas: ${object.count}`
    }
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

  // Factory de Camadas (SRP + Open/Closed)
  const layers = useLayerFactory({
    mapStyleUrl,
    busHexData,
    selectedHexes,
    selectedHexesArray,
    selectionConfirmed,
    selectedBusStops,
    handleHexClick
  })

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
        handleClearSelection={handleClearAndResetView}
        setSelectionConfirmed={handleConfirmSelection}
        MAP_STYLES={MAP_STYLES}
      />

      <DeckGL
        layers={layers}
        controller={CtrlController}
        {...MAP_CONTROLLER_CONFIG}
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