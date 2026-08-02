import { useCallback, useState } from 'react'
import type { ProfileFilter } from '@/shared/services/profileAdminService'
import type { Profile } from '@/shared/types/profile'

export type UserModal = 'add' | 'edit' | 'manageAccess' | 'suspend' | 'remove' | null

export function useUsersPageState() {
  const [search, setSearchRaw] = useState('')
  const [filter, setFilterRaw] = useState<ProfileFilter>('all')
  const [page, setPage] = useState(1)
  const [searchBarKey, setSearchBarKey] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [modal, setModal] = useState<UserModal>(null)

  const setSearch = useCallback((value: string) => {
    setSearchRaw((prev) => {
      if (prev !== value) {
        setPage(1)
      }
      return value
    })
  }, [])

  const setFilter = useCallback((value: ProfileFilter) => {
    setFilterRaw((prev) => {
      if (prev !== value) {
        setPage(1)
      }
      return value
    })
  }, [])

  const resetFilters = () => {
    setSearchRaw('')
    setFilterRaw('all')
    setPage(1)
    setSearchBarKey((key) => key + 1)
  }

  const openModal = (type: UserModal, profile?: Profile | null) => {
    setModal(type)
    if (profile !== undefined) {
      setSelectedProfile(profile)
    }
  }

  const closeModal = () => {
    setModal(null)
    setSelectedProfile(null)
  }

  return {
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    resetFilters,
    searchBarKey,
    selectedProfile,
    modal,
    openModal,
    closeModal,
  }
}
