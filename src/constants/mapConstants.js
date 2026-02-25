// src/constants/mapConstants.js
export const INITIAL_VIEW_STATE = {
  longitude: -46.6333,
  latitude: -23.5505,
  zoom: 10,
  pitch: 45,
  bearing: 0
}

export const SP_BOUNDS = {
  minLng: -47.06, maxLng: -46.30,
  minLat: -24.05, maxLat: -23.30,
  minZoom: 9, maxZoom: 16
}

export const MAP_CONTROLLER_CONFIG = {
  doubleClickZoom: false,
  dragRotate: true,
  touchRotate: true,
  keyboard: true,
  scrollZoom: true,
  dragPan: true,
  inertia: false
}

export const MAP_STYLES = [
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
