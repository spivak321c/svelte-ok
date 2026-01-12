<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { apiService } from "$services/api";
    import { nodesStore } from "$stores/nodes";
    import type { NetworkStats, LatencyDistribution } from "$types";
    import {
        formatBytes,
        formatNumber,
        formatDuration,
    } from "$utils/formatUtils";
    import MetricCard from "$components/MetricCard.svelte";
    import StorageForecast from "$lib/components/dashboard/StorageForecast.svelte";
    import LatencyChart from "$lib/components/dashboard/LatencyChart.svelte";
    import GeoPresence from "$lib/components/dashboard/GeoPresence.svelte";
    import PerformanceRegistry from "$lib/components/dashboard/PerformanceRegistry.svelte";
    import { goto } from "$app/navigation";

    // Icons
    import {
        Activity,
        Server,
        Container,
        HardDrive,
        Layers,
        Zap,
        Clock,
        Globe,
        CheckCircle,
        Lock,
        EyeOff,
        LayoutDashboard,
        RefreshCw,
        Eye,
        EyeOff as EyeOffIcon,
        ChevronUp,
        ChevronDown,
        Cpu,
        Network,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    // State
    let stats: NetworkStats | null = null;
    let latencyDist: LatencyDistribution | null = null;
    let loading = true;
    let isRefreshing = false;
    let showAdvancedStats = false;
    let showLatencyChart = false;
    let autoRefresh = true;
    let refreshInterval: ReturnType<typeof setInterval>;

    // Data Loaders
    async function fetchDashboardData() {
        try {
            const [statsData, latencyData] = await Promise.all([
                apiService.getStats(),
                apiService.getLatencyDistribution(),
            ]);
            stats = statsData;
            latencyDist = latencyData;

            // Also ensure nodes are loaded for the registry/geo
            if ($nodesStore.nodes.length === 0) {
                await nodesStore.fetch();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function init() {
        loading = true;
        await fetchDashboardData();
        loading = false;
    }

    async function handleManualRefresh() {
        isRefreshing = true;
        await fetchDashboardData();
        setTimeout(() => (isRefreshing = false), 800);
    }

    onMount(() => {
        init();
        if (autoRefresh) {
            refreshInterval = setInterval(() => {
                if (!isRefreshing) fetchDashboardData();
            }, 15000);
        }
    });

    onDestroy(() => {
        if (refreshInterval) clearInterval(refreshInterval);
    });

    // Derived Metrics
    $: networkHealth = stats?.network_health ?? 0;
    $: totalNodesCount = stats?.total_nodes ?? $nodesStore.nodes.length;
    $: activeNodesCount = stats?.online_nodes ?? 0;

    // Storage
    $: totalStorageBytes =
        stats?.total_storage_bytes ??
        (stats?.total_storage_pb ? stats.total_storage_pb * 1e15 : 0);
    $: usedStorageBytes =
        stats?.used_storage_bytes ??
        (stats?.used_storage_pb ? stats.used_storage_pb * 1e15 : 0);
    $: avgCommittedPerPod = stats?.average_storage_committed_per_pod_bytes ?? 0;

    // Advanced Metrics
    $: avgCpu = stats?.average_cpu_percent ?? 0;
    $: avgRamUsed = stats?.average_ram_used_bytes ?? 0;
    $: avgRamTotal = stats?.average_ram_total_bytes ?? 1;
    $: ramPercent = (avgRamUsed / avgRamTotal) * 100;
    $: avgUptimeSeconds = stats?.average_uptime_seconds ?? 0;
    $: totalTraffic =
        (stats?.total_packets_received ?? 0) + (stats?.total_packets_sent ?? 0);
    $: rpcNodes = stats?.nodes_with_rpc_stats ?? 0;

    // Geo & Registry Data
    $: geoData =
        $nodesStore.nodes.length > 0
            ? Array.from(
                  $nodesStore.nodes.reduce((acc, node) => {
                      const region =
                          node.country || node.geo_info?.region || "Unknown";
                      acc.set(region, (acc.get(region) || 0) + 1);
                      return acc;
                  }, new Map<string, number>()),
              )
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
            : [];

    $: getHealthVariant = (score: number) => {
        if (score >= 80) return "success";
        if (score >= 50) return "warning";
        return "error";
    };
</script>

<div
    class="p-6 md:p-10 space-y-10 pb-24 bg-background min-h-full transition-colors duration-300"
>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
            <div class="flex items-center gap-3">
                <div
                    class="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-primary/10 shadow-lg"
                >
                    <LayoutDashboard size={24} class="text-primary" />
                </div>
                <h1
                    class="text-3xl font-black text-foreground tracking-tighter"
                >
                    NETWORK VITALITY
                </h1>
            </div>
            <div class="flex items-center gap-2">
                <p class="text-sm text-muted-foreground font-bold">
                    Real-time infrastructure health monitoring.
                </p>
                {#if stats?.last_updated}
                    <span
                        class="text-[11px] bg-secondary text-secondary-foreground font-bold px-3 py-1 rounded-full flex items-center border border-border shadow-sm"
                    >
                        <Clock size={11} class="mr-1.5" />
                        Updated: {new Date(
                            stats.last_updated,
                        ).toLocaleTimeString()}
                    </span>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-3">
            <button
                class="flex items-center px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest text-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                on:click={handleManualRefresh}
                disabled={isRefreshing || loading}
            >
                <RefreshCw
                    size={14}
                    class={`mr-2.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`}
                />
                {isRefreshing ? "Syncing..." : "Sync Data"}
            </button>

            <button
                on:click={() => (showLatencyChart = !showLatencyChart)}
                class={`flex items-center px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm group border ${showLatencyChart ? "bg-primary/10 border-primary text-primary shadow-primary/10 shadow-lg" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
            >
                {#if showLatencyChart}
                    <EyeOffIcon size={14} class="mr-2.5" />
                {:else}
                    <Eye size={14} class="mr-2.5" />
                {/if}
                Latency
            </button>

            <button
                on:click={() => (showAdvancedStats = !showAdvancedStats)}
                class={`flex items-center px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm group border ${showAdvancedStats ? "bg-accent/10 border-accent text-accent shadow-accent/10 shadow-lg" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/30"}`}
            >
                {#if showAdvancedStats}
                    <ChevronUp size={14} class="mr-2.5" />
                {:else}
                    <ChevronDown size={14} class="mr-2.5" />
                {/if}
                {showAdvancedStats ? "Simple View" : "Advanced Stats"}
            </button>
        </div>
    </div>

    <!-- Core Metrics -->
    <section class="space-y-5">
        <div class="flex items-center gap-3">
            <span
                class="text-[12px] font-black text-primary uppercase tracking-[0.3em]"
                >Core Network Metrics</span
            >
            <div
                class="h-px flex-1 bg-gradient-to-r from-primary/50 via-primary/20 to-transparent"
            ></div>
        </div>
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        >
            <MetricCard
                label="Overall System Health"
                value={`${networkHealth.toFixed(1)}%`}
                variant={getHealthVariant(networkHealth)}
                icon={Activity}
                subtext="Infrastructure Integrity Score"
                {loading}
            />
            <MetricCard
                label="Total Nodes"
                value={totalNodesCount}
                variant="primary"
                icon={Server}
                subtext={`${activeNodesCount} currently online`}
                {loading}
            />
            <MetricCard
                label="Total Pods"
                value={stats?.total_pods ?? "-"}
                variant="secondary"
                icon={Container}
                subtext="Deployed storage units"
                {loading}
            />
            <MetricCard
                label="Storage Committed"
                value={formatBytes(totalStorageBytes)}
                variant="accent"
                icon={HardDrive}
                subtext="Global network capacity"
                {loading}
            />
            <MetricCard
                label="Storage Used"
                value={formatBytes(usedStorageBytes)}
                variant="warning"
                icon={Layers}
                subtext={`${((usedStorageBytes / (totalStorageBytes || 1)) * 100).toFixed(1)}% utilization`}
                {loading}
            />
            <MetricCard
                label="Avg Committed / Pod"
                value={formatBytes(avgCommittedPerPod)}
                variant="neutral"
                icon={Zap}
                subtext="Average per-pod storage"
                {loading}
            />
        </div>
    </section>

    <!-- Advanced Metrics -->
    {#if showAdvancedStats}
        <div class="space-y-10" transition:slide>
            <section class="space-y-5">
                <div class="flex items-center gap-3">
                    <span
                        class="text-[12px] font-black text-accent uppercase tracking-[0.3em]"
                        >Resource Consumption</span
                    >
                    <div
                        class="h-px flex-1 bg-gradient-to-r from-accent/50 via-accent/20 to-transparent"
                    ></div>
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <MetricCard
                        label="Avg CPU Load"
                        value={`${avgCpu.toFixed(1)}%`}
                        icon={Cpu}
                        variant="neutral"
                        subtext="Per-Node Processing"
                        {loading}
                    />
                    <MetricCard
                        label="Avg RAM Usage"
                        value={formatBytes(avgRamUsed)}
                        icon={Layers}
                        variant="neutral"
                        subtext={`${ramPercent.toFixed(1)}% of ${formatBytes(avgRamTotal)}`}
                        {loading}
                    />
                    <MetricCard
                        label="Avg Uptime"
                        value={formatDuration(avgUptimeSeconds)}
                        icon={Clock}
                        variant="neutral"
                        subtext="Continuous Availability"
                        {loading}
                    />
                    <MetricCard
                        label="Network Traffic"
                        value={formatNumber(totalTraffic)}
                        icon={Network}
                        variant="neutral"
                        subtext="Total Packets Processed"
                        {loading}
                    />
                </div>
            </section>

            <section class="space-y-4">
                <div class="flex items-center gap-3">
                    <span
                        class="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em]"
                        >Node Operations</span
                    >
                    <div
                        class="h-px flex-1 bg-gradient-to-r from-border to-transparent opacity-50"
                    ></div>
                </div>
                <div
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                >
                    <MetricCard
                        label="Public Nodes"
                        value={stats?.total_public_nodes ??
                            stats?.public_nodes ??
                            "-"}
                        icon={Globe}
                        trendText="External"
                        subtext={`${stats?.online_public_nodes ?? "-"} Online`}
                        {loading}
                    />
                    <MetricCard
                        label="Online Public"
                        value={stats?.online_public_nodes ?? "-"}
                        icon={CheckCircle}
                        variant="success"
                        trendText="Healthy"
                        {loading}
                    />
                    <MetricCard
                        label="Private Nodes"
                        value={stats?.total_private_nodes ??
                            stats?.private_nodes ??
                            "-"}
                        icon={Lock}
                        trendText="Internal"
                        subtext={`${stats?.online_private_nodes ?? "-"} Online`}
                        {loading}
                    />
                    <MetricCard
                        label="Online Private"
                        value={stats?.online_private_nodes ?? "-"}
                        icon={CheckCircle}
                        variant="success"
                        trendText="Healthy"
                        {loading}
                    />
                    <MetricCard
                        label="Offline Nodes"
                        value={stats?.offline_nodes ??
                            totalNodesCount - activeNodesCount}
                        variant={(stats?.offline_nodes ?? 0) > 0
                            ? "error"
                            : "neutral"}
                        icon={EyeOff}
                        {loading}
                    />
                    <MetricCard
                        label="Devnet Nodes"
                        value={stats?.devnet_node_count ?? "-"}
                        icon={Server}
                        trendText="Devnet"
                        {loading}
                    />
                    <MetricCard
                        label="Mainnet Nodes"
                        value={stats?.mainnet_node_count ?? "-"}
                        icon={Server}
                        trendText="Mainnet"
                        variant="primary"
                        {loading}
                    />
                    <MetricCard
                        label="Devnet Pods"
                        value={stats?.total_devnet_pods ?? "-"}
                        icon={Container}
                        trendText="Devnet"
                        {loading}
                    />
                    <MetricCard
                        label="Mainnet Pods"
                        value={stats?.total_mainnet_pods ?? "-"}
                        icon={Container}
                        trendText="Mainnet"
                        variant="primary"
                        {loading}
                    />
                    <MetricCard
                        label="RPC Active"
                        value={rpcNodes}
                        icon={Zap}
                        trendText="Enabled"
                        variant="accent"
                        {loading}
                    />
                </div>
            </section>
        </div>
    {/if}

    <!-- Storage Forecast -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div class="lg:col-span-3">
            <StorageForecast {totalStorageBytes} {usedStorageBytes} />
        </div>
    </div>

    <!-- Main Visuals & Registry -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {#if showLatencyChart}
            <div class="lg:col-span-3" transition:slide>
                <LatencyChart
                    distribution={latencyDist?.buckets ?? null}
                    onClose={() => (showLatencyChart = false)}
                />
            </div>
        {/if}

        <GeoPresence distribution={geoData} totalNodes={totalNodesCount} />

        <PerformanceRegistry
            nodes={$nodesStore.nodes}
            onNavigateToNodes={() => goto("/nodes")}
        />
    </div>
</div>
