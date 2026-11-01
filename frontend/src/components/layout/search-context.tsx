import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface SearchContextValue {
  search: string
  setSearch: (value: string) => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('')
  const value = useMemo(() => ({ search, setSearch }), [search])

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useGlobalSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useGlobalSearch must be used inside SearchProvider')
  return context
}
