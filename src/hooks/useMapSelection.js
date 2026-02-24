import { useState, useCallback, useMemo } from 'react'

export function useMapSelection(h3Resolution, busStopsWithHex) {
  const [selectedHexes, setSelectedHexes] = useState(() => new Set())
  const [selectionConfirmed, setSelectionConfirmed] = useState(false)

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

  const selectedHexesArray = useMemo(() => [...selectedHexes], [selectedHexes])

  const selectedBusStops = useMemo(() => {
    if (selectedHexes.size === 0) return []
    return busStopsWithHex.filter(p => selectedHexes.has(p.h3index))
  }, [busStopsWithHex, selectedHexes])

  return {
    selectedHexes,
    setSelectedHexes,
    selectionConfirmed,
    setSelectionConfirmed,
    handleHexClick,
    handleRemoveHex,
    handleClearSelection,
    selectedHexesArray,
    selectedBusStops
  }
}
