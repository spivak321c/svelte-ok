<script lang="ts">
    import { onMount } from "svelte";
    import { nodesStore } from "$stores/nodes";
    import { type SortField, type SortOrder } from "$types";
    import {
        ChevronLeft,
        ChevronRight,
        Search,
        Filter,
        Terminal,
        RefreshCw,
        LayoutGrid,
        List,
    } from "lucide-svelte";
    import NodeDetailPanel from "$components/NodeDetailPanel.svelte";
    import NodeCard from "$components/NodeCard.svelte";
    import type { PNode } from "$types";

    let searchTerm = "";
    let showFilters = false;
    let viewMode: "grid" | "list" = "grid";
    let selectedNode: PNode | null = null;

    $: filteredNodes = $nodesStore.nodes.filter((n) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            n.pubkey.toLowerCase().includes(term) ||
            (n.ip && n.ip.includes(term)) ||
            (n.city && n.city.toLowerCase().includes(term)) ||
            (n.country && n.country.toLowerCase().includes(term))
        );
    });

    function handleNodeClick(node: PNode) {
        selectedNode = node;
    }

    function handlePageChange(newPage: number) {
        if (
            newPage >= 1 &&
            newPage <= ($nodesStore.pagination?.total_pages || 1)
        ) {
            nodesStore.setPage(newPage);
        }
    }

    onMount(() => {
        nodesStore.fetch();
    });
</script>

<NodeDetailPanel
    node={selectedNode}
    on:close={() => (selectedNode = null)}
    allNodes={$nodesStore.nodes}
/>

<div class="flex flex-col h-full bg-background text-foreground p-6">
    <!-- ... (keep header) -->

    <!-- Content -->
    {#if $nodesStore.loading && $nodesStore.nodes.length === 0}
        <div
            class="flex-1 flex items-center justify-center text-muted-foreground animate-pulse"
        >
            <RefreshCw class="animate-spin mr-2" /> Loading Registry...
        </div>
    {:else if viewMode === "grid"}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {#each filteredNodes as node (node.pubkey)}
                <NodeCard
                    {node}
                    autoNavigate={false}
                    on:click={() => handleNodeClick(node)}
                />
            {/each}
        </div>
    {:else}
        <div class="flex flex-col gap-2">
            {#each filteredNodes as node (node.pubkey)}
                <NodeCard
                    {node}
                    listMode={true}
                    autoNavigate={false}
                    on:click={() => handleNodeClick(node)}
                />
            {/each}
        </div>
    {/if}

    <!-- Footer Pagination -->
    {#if $nodesStore.pagination}
        <div
            class="mt-6 flex items-center justify-between border-t border-border pt-4"
        >
            <div class="text-xs text-muted-foreground font-mono">
                Page {$nodesStore.page} of {$nodesStore.pagination.total_pages}
            </div>
            <div class="flex gap-2">
                <button
                    disabled={$nodesStore.page <= 1}
                    on:click={() => handlePageChange($nodesStore.page - 1)}
                    class="p-2 border border-border rounded-md disabled:opacity-50 hover:bg-muted"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    disabled={$nodesStore.page >=
                        $nodesStore.pagination.total_pages}
                    on:click={() => handlePageChange($nodesStore.page + 1)}
                    class="p-2 border border-border rounded-md disabled:opacity-50 hover:bg-muted"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    {/if}
</div>
