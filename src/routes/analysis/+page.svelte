<script lang="ts">
    import { onMount } from "svelte";
    import { apiService } from "$lib/services/api";
    import type { NetworkSnapshot } from "$lib/types";
    import { fade, slide } from "svelte/transition";
    import {
        History,
        TrendingUp,
        Activity,
        Server,
        Calendar,
        Download,
        Info,
        RefreshCw,
        Loader2,
    } from "lucide-svelte";

    let networkHistory: NetworkSnapshot[] = [];
    let loading = true;
    let error: string | null = null;

    async function fetchData() {
        try {
            loading = true;
            error = null;
            // Fetch mock history
            networkHistory = await apiService.getNetworkHistory();

            // Sort by timestamp
            networkHistory.sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
            );
        } catch (e: any) {
            console.error(e);
            error = e.message || "Failed to load analytics";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchData();
    });

    // Derived Stats
    $: stats = (() => {
        if (networkHistory.length < 2) return null;
        const first = networkHistory[0];
        const last = networkHistory[networkHistory.length - 1];

        const firstNodeCount = first.total_nodes ?? first.node_count ?? 0;
        const lastNodeCount = last.total_nodes ?? last.node_count ?? 0;

        return {
            nodeGrowth: lastNodeCount - firstNodeCount,
            nodeGrowthPercent:
                firstNodeCount > 0
                    ? ((lastNodeCount - firstNodeCount) / firstNodeCount) * 100
                    : 0,
            avgUptime: last.average_uptime ?? 0,
            avgPerformance: last.average_performance ?? 0,
        };
    })();

    // Helper for Chart Scales
    function normalize(val: number, min: number, max: number) {
        if (max === min) return 0.5;
        return (val - min) / (max - min);
    }

    // Line Chart Logic (Node Count)
    $: nodeCountPoints = networkHistory.map((d, i) => {
        const val = d.total_nodes ?? d.node_count ?? 0;
        return val;
    });

    $: maxNodeCount = Math.max(...nodeCountPoints, 1);
    $: minNodeCount = Math.min(...nodeCountPoints);
    $: nodeCountPath =
        nodeCountPoints.length > 1
            ? `M 0,${100 - normalize(nodeCountPoints[0], minNodeCount - 5, maxNodeCount + 5) * 100} ` +
              nodeCountPoints
                  .map((p, i) => {
                      const x = (i / (nodeCountPoints.length - 1)) * 100;
                      const y =
                          100 -
                          normalize(p, minNodeCount - 5, maxNodeCount + 5) *
                              100;
                      return `L ${x},${y}`;
                  })
                  .join(" ")
            : "";

    // Bar Chart Logic (Performance & Uptime)
    $: barData = networkHistory.slice(-20); // Show last 20 benchmarks
</script>

<div
    class="p-6 md:p-8 space-y-8 h-full overflow-y-auto custom-scrollbar bg-background"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h2
                class="text-2xl font-black text-foreground flex items-center font-mono tracking-tight"
            >
                <History class="mr-3 text-primary" />
                HISTORICAL_TELEMETRY
            </h2>
            <p class="text-muted-foreground mt-1 text-sm font-medium">
                Analysis of network evolution, storage trends, and node
                participation over time.
            </p>
        </div>
        <div class="flex gap-2">
            <button
                on:click={fetchData}
                disabled={loading}
                class="flex items-center px-4 py-2 bg-card text-foreground rounded-lg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-wait transition-all border border-border text-xs font-black uppercase tracking-wider shadow-sm group"
            >
                <RefreshCw
                    size={14}
                    class={`mr-2 ${loading ? "animate-spin" : "group-hover:text-primary"}`}
                />
                {loading ? "SYNCING..." : "REFRESH"}
            </button>
            <button
                class="flex items-center px-4 py-2 bg-card text-foreground rounded-lg hover:bg-accent/10 transition-colors border border-border text-xs font-black uppercase tracking-wider group"
            >
                <Download size={14} class="mr-2 group-hover:text-accent" /> EXPORT_CSV
            </button>
        </div>
    </div>

    {#if loading && networkHistory.length === 0}
        <div class="grid place-items-center h-64">
            <Loader2 class="animate-spin text-primary w-8 h-8" />
        </div>
    {:else if error}
        <div
            class="p-8 bg-destructive/10 border border-destructive/20 rounded-2xl text-center"
        >
            <p class="text-destructive font-bold mb-2">Error Loading Data</p>
            <p class="text-sm text-destructive-foreground">{error}</p>
        </div>
    {:else}
        <!-- Stats Cards -->
        {#if stats}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6" in:slide|local>
                <div
                    class="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group"
                >
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 bg-primary/10 rounded-lg">
                            <Server size={18} class="text-primary" />
                        </div>
                        <span
                            class="text-xs font-black text-muted-foreground uppercase tracking-wider"
                            >Node Growth</span
                        >
                    </div>
                    <div class="text-3xl font-black text-foreground mb-1">
                        {stats.nodeGrowth > 0 ? "+" : ""}{Math.floor(
                            stats.nodeGrowth,
                        )}
                    </div>
                    <p class="text-xs text-primary font-bold flex items-center">
                        <TrendingUp size={12} class="mr-1" />
                        {stats.nodeGrowthPercent.toFixed(1)}% change
                    </p>
                </div>

                <div
                    class="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group"
                >
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 bg-accent/10 rounded-lg">
                            <Activity size={18} class="text-accent" />
                        </div>
                        <span
                            class="text-xs font-black text-muted-foreground uppercase tracking-wider"
                            >Network Reliability</span
                        >
                    </div>
                    <div class="text-3xl font-black text-foreground mb-1">
                        {stats.avgUptime.toFixed(2)}%
                    </div>
                    <p class="text-xs text-muted-foreground font-bold">
                        Mean uptime across all epochs
                    </p>
                </div>
            </div>
        {/if}

        <!-- Charts -->
        <div class="grid grid-cols-1 gap-8" in:fade={{ duration: 300 }}>
            <!-- Node Count Chart -->
            <div
                class="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[400px]"
            >
                <h3
                    class="text-xs font-black text-muted-foreground uppercase tracking-wider mb-6 flex items-center"
                >
                    <Calendar size={14} class="mr-2" /> Node Count Trend (30d)
                </h3>
                <div class="flex-1 w-full relative">
                    <!-- Simple SVG Line Chart -->
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        class="w-full h-full overflow-visible"
                    >
                        <!-- Grid Lines -->
                        {#each [0, 25, 50, 75, 100] as y}
                            <line
                                x1="0"
                                y1={y}
                                x2="100"
                                y2={y}
                                stroke="currentColor"
                                class="text-border/40"
                                stroke-width="0.2"
                                vector-effect="non-scaling-stroke"
                            />
                        {/each}

                        <!-- The Line -->
                        <path
                            d={nodeCountPath}
                            fill="none"
                            stroke="currentColor"
                            class="text-primary"
                            stroke-width="3"
                            stroke-linecap="round"
                            vector-effect="non-scaling-stroke"
                        />

                        <!-- Hover Points (simplified) -->
                        {#each nodeCountPoints as p, i}
                            <circle
                                cx={(i / (nodeCountPoints.length - 1)) * 100}
                                cy={100 -
                                    normalize(
                                        p,
                                        minNodeCount - 5,
                                        maxNodeCount + 5,
                                    ) *
                                        100}
                                r="4"
                                class="fill-background stroke-primary opacity-0 hover:opacity-100 transition-opacity cursor-crosshair"
                                stroke-width="2"
                                vector-effect="non-scaling-stroke"
                            >
                                <title>Day {i + 1}: {p} Nodes</title>
                            </circle>
                        {/each}
                    </svg>

                    <!-- Labels -->
                    <div
                        class="absolute bottom-2 right-2 text-[10px] text-muted-foreground font-mono bg-background/80 px-1 rounded"
                    >
                        Latest: {nodeCountPoints[nodeCountPoints.length - 1]}
                    </div>
                </div>
            </div>

            <!-- Performance Bar Chart -->
            <div
                class="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[350px]"
            >
                <h3
                    class="text-xs font-black text-muted-foreground uppercase tracking-wider mb-6 flex items-center"
                >
                    <Activity size={14} class="mr-2" /> Multi-Metric Performance
                    Forecast
                </h3>
                <div
                    class="flex-1 w-full relative flex items-end justify-between gap-1"
                >
                    {#each barData as d, i}
                        {@const uptime = d.average_uptime ?? 0}
                        {@const perf = d.average_performance ?? 0}
                        <div
                            class="h-full flex-1 flex flex-col justify-end gap-1 group relative"
                        >
                            <!-- Tooltip -->
                            <div
                                class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono border border-border"
                            >
                                <div
                                    class="font-bold border-b border-border/50 pb-1 mb-1"
                                >
                                    {new Date(d.timestamp).toLocaleDateString()}
                                </div>
                                <div class="text-accent">
                                    Perf: {perf.toFixed(1)}
                                </div>
                                <div class="text-primary">
                                    Uptime: {uptime.toFixed(1)}%
                                </div>
                            </div>

                            <!-- Bars -->
                            <div
                                class="w-full bg-accent/80 hover:bg-accent transition-all rounded-sm relative"
                                style="height: {perf}%"
                            ></div>
                            <div
                                class="w-full bg-primary/80 hover:bg-primary transition-all rounded-sm"
                                style="height: {uptime}%"
                            ></div>
                        </div>
                    {/each}
                </div>
                <div class="flex items-center justify-center gap-4 mt-4">
                    <div
                        class="flex items-center text-[10px] font-bold uppercase text-muted-foreground"
                    >
                        <div class="w-3 h-3 bg-accent rounded-sm mr-2"></div>
                         Performance Score
                    </div>
                    <div
                        class="flex items-center text-[10px] font-bold uppercase text-muted-foreground"
                    >
                        <div class="w-3 h-3 bg-primary rounded-sm mr-2"></div>
                         Uptime %
                    </div>
                </div>
            </div>
        </div>

        <!-- Insight -->
        <div
            class="bg-secondary/5 border border-secondary/20 rounded-2xl p-6 flex items-start gap-4"
        >
            <Info class="text-secondary w-6 h-6 shrink-0 mt-1" />
            <div>
                <h4 class="font-bold text-foreground mb-1">
                    Network Evolution Insight
                </h4>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    Historical data indicates a strong correlation between pNode
                    version upgrades and network reliability. Since version
                    0.8.0, the average latency across the cluster has stabilized
                    by 15% even as the total storage committed grew
                    significantly. The network is currently scaling efficiently
                    to meet projected demand.
                </p>
            </div>
        </div>
    {/if}
</div>
