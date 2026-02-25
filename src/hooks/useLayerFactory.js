import { useMemo } from 'react';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers';
import { MAP_STYLES } from '../constants/mapConstants';

export function useLayerFactory({
  mapStyleUrl,
  busHexData,
  selectedHexes,
  selectedHexesArray,
  selectionConfirmed,
  selectedBusStops,
  handleHexClick
}) {
  
  // 1. Camada do Mapa Base
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

  // 2. Camada de Hexágonos H3
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
  }), [busHexData, selectedHexes, selectedHexesArray, selectionConfirmed, handleHexClick]);

  // 3. Camada de Pontos Selecionados
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

  // 4. Camada de Labels (Rótulos)
  const selectedStyle = MAP_STYLES.find(s => s.url === mapStyleUrl);
  const labelsUrl = selectedStyle?.labels;

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
  }) : null, [labelsUrl]);

  // Retorna array filtrado (remove nulls)
  return useMemo(() => 
    [basemapLayer, h3BusLayer, selectedStopsLayer, labelsLayer].filter(Boolean),
    [basemapLayer, h3BusLayer, selectedStopsLayer, labelsLayer]
  );
}
