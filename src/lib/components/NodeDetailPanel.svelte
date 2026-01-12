<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fly } from "svelte/transition";
    import {
        X,
        Copy,
        Check,
        Server,
        Activity,
        Database,
        Clock,
        Radio,
        Globe,
        Share2,
    } from "lucide-svelte";
    import type { PNode } from "$types";
    import { formatBytes } from "$utils/formatUtils";
    import { copyToClipboard } from "$utils/clipboardUtils";

    export let node: PNode | null = null;
    export let allNodes: PNode[] = [];

    const dispatch = createEventDispatcher();

    let copied = false;
    let lastNodeId = node?.pubkey;

    // Reset copied state when node changes
    $: if (node?.pubkey !== lastNodeId) {
        lastNodeId = node?.pubkey;
        copied = false;
    }

    async function handleCopy() {
        if (!node) return;
        const success = await copyToClipboard(node.pubkey);
        if (success) {
            copied = true;
            setTimeout(() => (copied = false), 2000);
        }
    }

    function onClose() {
        dispatch("close");
    }

    // Gossip Peers Logic
    $: gossipPeers = (() => {
        if (!node || !allNodes.length) return [];

        const peers: PNode[] = [];

        // 1. Add local cluster peers (nodes in same region logic matching React)
        const regionPeers = allNodes
            .filter(
                (n) => n.pubkey !== node?.pubkey && n.country === node?.country,
            )
            .slice(0, 3);
        peers.push(...regionPeers);

        // 2. Add 1 random bridge peer
        const otherRegions = allNodes.filter(
            (n) => n.country !== node?.country,
        );
        if (otherRegions.length > 0) {
            const idx = node.pubkey.charCodeAt(0) % otherRegions.length;
            peers.push(otherRegions[idx]);
        }
        return peers;
    })();
</script>

{#if node}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        on:click={onClose}
    />

    <!-- Panel -->
    <div
        class="fixed top-0 right-0 h-full w-full md:w-[380px] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 overflow-y-auto"
        transition:fly={{ x: 380, duration: 300 }}
    >
        <div class="p-6 space-y-8">
            <!-- Header -->
            <div class="flex justify-between items-start">
                <div>
                    <h2
                        class="text-xl font-bold text-foreground tracking-tight"
                    >
                        Node Details
                    </h2>
                    <p class="text-muted-foreground text-xs mt-1">
                        Detailed metrics & connectivity
                    </p>
                </div>
                <button
                    on:click={onClose}
                    class="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Status Badge -->
            <div
                class="flex items-center space-x-3 bg-card p-4 rounded-xl border border-border"
            >
                <div
                    class={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                        node.status === "active" || node.status === "online"
                            ? "bg-secondary/20"
                            : node.status === "delinquent" ||
                                node.status === "warning"
                              ? "bg-amber-500/10"
                              : "bg-destructive/10"
                    }`}
                >
                    <Activity
                        class={`w-6 h-6 ${
                            node.status === "active" || node.status === "online"
                                ? "text-secondary"
                                : node.status === "delinquent" ||
                                    node.status === "warning"
                                  ? "text-amber-500"
                                  : "text-destructive"
                        }`}
                    />
                    <span
                        class={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                            node.status === "active" || node.status === "online"
                                ? "bg-secondary"
                                : node.status === "delinquent" ||
                                    node.status === "warning"
                                  ? "bg-amber-500"
                                  : "bg-destructive"
                        }`}
                    ></span>
                </div>
                <div>
                    <p
                        class="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                    >
                        Current Status
                    </p>
                    <p
                        class={`text-lg font-semibold capitalize ${
                            node.status === "active" || node.status === "online"
                                ? "text-secondary"
                                : node.status === "delinquent" ||
                                    node.status === "warning"
                                  ? "text-amber-500"
                                  : "text-red-400"
                        }`}
                    >
                        {node.status}
                    </p>
                </div>
            </div>

            <!-- Identity -->
            <div class="space-y-3">
                <h3
                    class="text-sm font-semibold text-foreground flex items-center"
                >
                    <Server class="w-4 h-4 mr-2 text-primary" /> Identity
                </h3>
                <div
                    class="bg-secondary/10 rounded-lg p-3 border border-border group relative"
                >
                    <p
                        class="text-[10px] text-muted-foreground uppercase tracking-wider mb-1"
                    >
                        Pubkey
                    </p>
                    <p class="font-mono text-xs text-foreground break-all pr-8">
                        {node.pubkey}
                    </p>
                    <button
                        on:click={handleCopy}
                        class="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all"
                    >
                        {#if copied}
                            <Check size={14} />
                        {:else}
                            <Copy size={14} />
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Connection Info -->
            <div class="space-y-3">
                <h3
                    class="text-sm font-semibold text-foreground flex items-center"
                >
                    <Globe class="w-4 h-4 mr-2 text-primary" /> Connectivity
                </h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-card p-3 rounded-lg border border-border">
                        <p class="text-[10px] text-muted-foreground mb-1">
                            IP Address
                        </p>
                        <p class="font-mono text-sm text-foreground">
                            {node.ip}
                        </p>
                    </div>
                    <div class="bg-card p-3 rounded-lg border border-border">
                        <p class="text-[10px] text-muted-foreground mb-1">
                            Port
                        </p>
                        <p class="font-mono text-sm text-foreground">
                            {node.port}
                        </p>
                    </div>
                </div>
                <div class="bg-card p-3 rounded-lg border border-border">
                    <p class="text-[10px] text-muted-foreground mb-1">
                        Location
                    </p>
                    <p class="font-mono text-xs text-foreground">
                        {node.city}, {node.country}
                    </p>
                </div>
                <div
                    class="bg-card p-3 rounded-lg border border-border flex justify-between items-center"
                >
                    <div>
                        <p class="text-[10px] text-muted-foreground mb-1">
                            Version
                        </p>
                        <p class="font-mono text-sm text-foreground">
                            {node.version}
                        </p>
                    </div>
                    <div
                        class="text-xs text-secondary bg-secondary/10 px-2 py-1 rounded border border-secondary/20"
                    >
                        Latest
                    </div>
                </div>
            </div>

            <!-- Gossip Peers -->
            <div class="space-y-3">
                <h3
                    class="text-sm font-semibold text-foreground flex items-center"
                >
                    <Share2 class="w-4 h-4 mr-2 text-primary" /> Gossip Cluster
                </h3>
                <div
                    class="bg-card rounded-lg border border-border overflow-hidden"
                >
                    {#if gossipPeers.length > 0}
                        <div class="divide-y divide-border">
                            {#each gossipPeers as peer}
                                <div
                                    class="p-3 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                                >
                                    <div class="flex items-center">
                                        <div
                                            class={`w-2 h-2 rounded-full mr-2 ${
                                                peer.status === "active" ||
                                                peer.status === "online"
                                                    ? "bg-secondary"
                                                    : "bg-amber-500"
                                            }`}
                                        ></div>
                                        <div>
                                            <p
                                                class="text-xs font-mono text-foreground"
                                            >
                                                {peer.pubkey.substring(0, 8)}...
                                            </p>
                                            <p
                                                class="text-[9px] text-muted-foreground uppercase"
                                            >
                                                {peer.country === node.country
                                                    ? "Local Peer"
                                                    : "Bridge Peer"}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        class="text-[10px] font-mono text-muted-foreground"
                                        >{peer.response_time}ms</span
                                    >
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div
                            class="p-4 text-center text-xs text-muted-foreground"
                        >
                            No peers detected
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Performance -->
            <div class="space-y-3">
                <h3
                    class="text-sm font-semibold text-foreground flex items-center"
                >
                    <Database class="w-4 h-4 mr-2 text-primary" /> Performance
                </h3>
                <div
                    class="bg-card rounded-lg border border-border divide-y divide-border"
                >
                    <div class="p-3 flex justify-between items-center">
                        <div
                            class="flex items-center text-muted-foreground text-sm"
                        >
                            <Database class="w-4 h-4 mr-3 opacity-50" /> Total Storage
                        </div>
                        <span class="font-mono text-foreground"
                            >{formatBytes(node.storage_capacity ?? 0)}</span
                        >
                    </div>
                    <div class="p-3 flex justify-between items-center">
                        <div
                            class="flex items-center text-muted-foreground text-sm"
                        >
                            <Database class="w-4 h-4 mr-3 opacity-50" /> Used Storage
                        </div>
                        <span class="font-mono text-foreground"
                            >{formatBytes(node.storage_used ?? 0)}</span
                        >
                    </div>
                    <div class="p-3 flex justify-between items-center">
                        <div
                            class="flex items-center text-muted-foreground text-sm"
                        >
                            <Clock class="w-4 h-4 mr-3 opacity-50" /> Uptime
                        </div>
                        <span class="font-mono text-secondary"
                            >{node.uptime_score ?? 0}% (score)</span
                        >
                    </div>
                    <div class="p-3 flex justify-between items-center">
                        <div
                            class="flex items-center text-muted-foreground text-sm"
                        >
                            <Radio class="w-4 h-4 mr-3 opacity-50" /> Last Seen
                        </div>
                        <span class="font-mono text-foreground text-xs"
                            >{node.last_seen
                                ? new Date(node.last_seen).toLocaleString()
                                : "N/A"}</span
                        >
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="pt-4 flex space-x-3">
                <button
                    on:click={onClose}
                    class="flex-1 py-3 bg-card hover:bg-secondary/20 text-foreground rounded-lg transition-colors text-sm font-medium border border-border"
                >
                    Close Panel
                </button>
                <a
                    href={`/nodes/${node.pubkey}`}
                    class="flex-1 py-3 bg-primary text-primary-foreground hover:brightness-110 rounded-lg transition-all text-sm font-medium flex items-center justify-center shadow-lg shadow-primary/20"
                >
                    Full Details
                </a>
            </div>
        </div>
    </div>
{/if}
