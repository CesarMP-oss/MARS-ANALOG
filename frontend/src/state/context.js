import { createContext, useContext, useMemo } from 'react'
import { mergeRegions } from './regions.js'

const LOADING = { status: 'loading', body: null, error: null }

export const AppDataContext = createContext({
  health: LOADING,
  limitations: LOADING,
  datasets: LOADING,
  regions: LOADING,
})

export function useAppData() {
  return useContext(AppDataContext)
}

export function useRegions() {
  const { datasets, regions } = useAppData()
  return useMemo(() => mergeRegions(datasets, regions), [datasets, regions])
}
