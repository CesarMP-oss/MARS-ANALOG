import { useMemo } from 'react'
import { getDatasets, getHealth, getLimitations, getRegions } from '../api/client.js'
import { useApiResource } from '../api/useApiResource.js'
import { AppDataContext } from './context.js'

export function AppDataProvider({ children }) {
  const health = useApiResource('health', getHealth)
  const limitations = useApiResource('limitations', getLimitations)
  const datasets = useApiResource('datasets', getDatasets)
  const regions = useApiResource('regions', getRegions)
  const value = useMemo(
    () => ({ health, limitations, datasets, regions }),
    [health, limitations, datasets, regions],
  )
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
