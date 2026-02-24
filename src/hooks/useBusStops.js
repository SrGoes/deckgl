import { useState, useCallback, useMemo } from 'react'
import * as h3 from 'h3-js'

const SAO_PAULO_BBOX = { south: -24.05, west: -47.06, north: -23.30, east: -46.30 }

export function useBusStops(h3Resolution) {
  const [busStops, setBusStops] = useState([])
  const [loadingBus, setLoadingBus] = useState(false)
  const [busError, setBusError] = useState('')

  const fetchBusStops = useCallback(async () => {
    setLoadingBus(true)
    setBusError('')
    try {
      const query = `[out:json];(node[\"highway\"=\"bus_stop\"](${SAO_PAULO_BBOX.south},${SAO_PAULO_BBOX.west},${SAO_PAULO_BBOX.north},${SAO_PAULO_BBOX.east}););out body;`
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

  const busStopsWithHex = useMemo(() => 
    busStops.map(p => ({ ...p, h3index: h3.latLngToCell(p.position[1], p.position[0], h3Resolution) })), 
  [busStops, h3Resolution])

  return {
    busStops,
    loadingBus,
    busError,
    fetchBusStops,
    busStopsWithHex
  }
}
