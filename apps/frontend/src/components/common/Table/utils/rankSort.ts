import { SortingFn, sortingFns } from '@tanstack/react-table'
import { compareItems, RankingInfo } from '@tanstack/match-sorter-utils'

/**
 * Hybrid sorting function that uses ranking from globalFilter when available,
 * otherwise falls back to standard alphanumeric sorting
 */
export const rankSort: SortingFn<unknown> = (rowA, rowB, columnId) => {
    // Get ranking info stored by globalFilter's addMeta
    const rankA = rowA.columnFiltersMeta?.global as RankingInfo | undefined
    const rankB = rowB.columnFiltersMeta?.global as RankingInfo | undefined

    // If both have ranks, use rank-based sorting (for search relevance)
    if (rankA && rankB) {
        return compareItems(rankA, rankB)
    }

    // If only one has rank, that one goes first
    if (rankA) return -1
    if (rankB) return 1

    // If neither has rank, fallback to standard alphanumeric sorting
    return sortingFns.alphanumeric(rowA, rowB, columnId)
}
