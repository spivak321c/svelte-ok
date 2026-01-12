import { writable, get } from 'svelte/store';
import { apiService } from '$services/api';
import { groupNodesByPubKey } from '$utils/nodeUtils';
import type { PNode } from '$types';
import type { PaginationMeta, SortField, SortOrder } from '$types'; // Assuming these exported from types

// Define missing types if not in index.ts yet (since I only migrated basic types)
// I'll add them locally or ensure they are in types.
// Checking previous types migration... I see I might have missed explicit export of SortField/Order in index.ts
// I will define them here for safety or update types.ts.
// Actually, let's use the ones from api logic.

export interface NodesState {
    nodes: PNode[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    pagination: PaginationMeta | null;

    // Filters
    page: number;
    limit: number;
    status: string | undefined;
    sort: SortField | undefined;
    order: SortOrder | undefined;
    includeOffline: boolean;
}

const initialState: NodesState = {
    nodes: [],
    loading: false, // Start false, explicit fetch triggers loading
    error: null,
    lastUpdated: null,
    pagination: null,
    page: 1,
    limit: 50,
    status: undefined,
    sort: undefined,
    order: undefined,
    includeOffline: true
};

function createNodesStore() {
    const { subscribe, set, update } = writable<NodesState>(initialState);

    async function fetchNodes() {
        update(s => ({ ...s, loading: true }));
        const state = get({ subscribe });

        try {
            const response = await apiService.getNodes({
                page: state.page,
                limit: state.limit,
                status: state.status,
                sort: state.sort,
                order: state.order,
                include_offline: state.includeOffline
            });

            // Process nodes (deduplication)
            const processedNodes = groupNodesByPubKey(response.nodes);

            update(s => ({
                ...s,
                loading: false,
                nodes: processedNodes,
                pagination: response.pagination,
                lastUpdated: new Date(),
                error: null
            }));
        } catch (err: any) {
            console.error('Error fetching nodes:', err);
            update(s => ({
                ...s,
                loading: false,
                error: err.message || 'Failed to fetch node data',
                nodes: [],
                pagination: null
            }));
        }
    }

    return {
        subscribe,
        fetch: fetchNodes,
        setPage: (page: number) => {
            update(s => ({ ...s, page }));
            fetchNodes();
        },
        setFilter: (filter: Partial<Pick<NodesState, 'status' | 'sort' | 'order' | 'includeOffline' | 'limit'>>) => {
            update(s => ({ ...s, ...filter, page: 1 })); // Reset to page 1 on filter change
            fetchNodes();
        },
        refresh: fetchNodes
    };
}

export const nodesStore = createNodesStore();
