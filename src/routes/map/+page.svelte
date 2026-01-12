<script lang="ts">
    import { onMount } from "svelte";
    import EarthView from "$lib/components/EarthView.svelte";
    import { nodesStore } from "$stores/nodes";
    import { goto } from "$app/navigation";

    let selectedNodeId: string | null = null;

    function handleNodeClick(node: any) {
        goto(`/nodes/${node.pubkey}`);
    }

    onMount(() => {
        nodesStore.fetch();
    });
</script>

<div class="h-full bg-background">
    <EarthView
        nodes={$nodesStore.nodes}
        stats={null}
        {selectedNodeId}
        onNodeClick={handleNodeClick}
        lastUpdated={$nodesStore.lastUpdated}
        refetch={() => nodesStore.fetch()}
        isRefetching={$nodesStore.loading}
    />
</div>
