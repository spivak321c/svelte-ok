<script lang="ts">
    import { onMount } from "svelte";
    import type { PNode, NodeHistoryPoint } from "$types";
    import { apiService } from "$services/api";
    import { goto } from "$app/navigation";
    import { formatBytes } from "$utils/formatUtils";
    import { copyToClipboard } from "$utils/clipboardUtils";

    import {
        ArrowLeft,
        Clock,
        Shield,
        AlertTriangle,
        Server,
        Zap,
        Cpu,
        MemoryStick as Memory,
        Layers,
        Activity,
        Code,
        Copy,
        Check,
        Globe,
        Coins,
        Network,
        Loader2,
        TrendingUp,
        Info,
    } from "lucide-svelte";
    import MiniMap from "$components/MiniMap.svelte";
    import MetricCard from "$components/MetricCard.svelte";
    import { scaleLinear } from "d3-scale";
    import { extent, max } from "d3-array";
    import { area, curveMonotoneX } from "d3-shape";

    export let data: { node: PNode };
    $: node = data.node;

    let history: (NodeHistoryPoint & {
        time: number;
        storage: number;
        cpu: number;
        ram: number;
    })[] = [];
    let historyLoading = true;
    let copied = false;

    // React's detailed view uses mock data for fields not in API yet (CPU, RAM, Storage history).
    // We replicate this behavior.

    onMount(async () => {
        try {
            historyLoading = true;
            const apiHistory = await apiService.getNodeHistory(node.pubkey, 48);

            // Transform and Mock missing data
            history =
                apiHistory.length > 0
                    ? apiHistory.map((point, i) => ({
                          ...point,
                          time: i,
                          // Mock variations based on current values to create "charts"
                          storage:
                              (node.storage_used_gb ?? 0) *
                              (1 + (Math.random() * 0.1 - 0.05)),
                          cpu:
                              (node.performance_score ?? 50) *
                              (1 + (Math.random() * 0.2 - 0.1)),
                          ram:
                              ((node.ram_used ?? 0) / (node.ram_total ?? 1)) *
                              100 *
                              (1 + (Math.random() * 0.1 - 0.05)),
                      }))
                    : Array.from({ length: 24 }).map((_, i) => ({
                          timestamp: Date.now() - (24 - i) * 3600000,
                          latency:
                              (node.response_time ?? 0) +
                              (Math.random() * 20 - 10),
                          uptime: node.uptime_score ?? 100,
                          time: i,
                          storage: node.storage_used_gb ?? 0,
                          cpu: node.performance_score ?? 0,
                          ram: 50, // default
                      }));
        } catch (e) {
            console.error("Failed to fetch history", e);
        } finally {
            historyLoading = false;
        }
    });

    async function handleCopy() {
        const success = await copyToClipboard(JSON.stringify(node, null, 2));
        if (success) {
            copied = true;
            setTimeout(() => (copied = false), 2000);
        }
    }

    // Charting functionality using d3-shape + scales
    function createChartPath(
        data: any[],
        key: string,
        width: number,
        height: number,
        options: { fill?: boolean } = {},
    ) {
        if (!data || data.length === 0) return "";

        const xDomain = extent(data, (d: any) => d.time) as [number, number];
        const yMax = max(data, (d: any) => d[key]) as number;
        // Add padding to yMax so chart isn't cramped
        const yDomain = [0, yMax * 1.1];

        const xScale = scaleLinear().domain(xDomain).range([0, width]);
        const yScale = scaleLinear().domain(yDomain).range([height, 0]);

        const generator = area<any>()
            .x((d: any) => xScale(d.time))
            .y0((d: any) => (options.fill ? height : yScale(d[key]))) // If fill, extend to bottom
            .y1((d: any) => yScale(d[key]))
            .curve(curveMonotoneX);

        return generator(data) || "";
    }
</script>

<div
    class="h-full flex flex-col bg-background text-foreground overflow-y-auto custom-scrollbar animate-in fade-in duration-300"
>
    <!-- Top Bar -->
    <div
        class="bg-card/50 border-b border-border p-4 lg:p-6 sticky top-0 z-20 flex items-center justify-between backdrop-blur-md"
    >
        <div class="flex items-center gap-4">
            <button
                on:click={() => goto("/nodes")}
                class="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-bold font-mono tracking-tight">
                        {node.pubkey.substring(0, 8)}...{node.pubkey.substring(
                            node.pubkey.length - 6,
                        )}
                    </h1>
                    <div class="flex items-center gap-2">
                        <span
                            class={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border ${node.status === "active" || node.status === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}
                        >
                            {node.status}
                        </span>
                        {#if node.is_registered}
                            <span
                                class="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border bg-primary/10 text-primary border-primary/20"
                            >
                                <Shield size={10} /> Registered
                            </span>
                        {/if}
                    </div>
                </div>
                <div
                    class="text-xs text-muted-foreground mt-1 flex items-center"
                >
                    <Clock size={12} class="mr-1" /> Last seen: {node.last_seen
                        ? new Date(
                              node.last_seen || Date.now(),
                          ).toLocaleString()
                        : "N/A"}
                </div>
            </div>
        </div>
        <div class="hidden md:block">
            <button
                on:click={() => goto(`/playground?node=${node.pubkey}`)}
                class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20"
            >
                Connect RPC
            </button>
        </div>
    </div>

    <div class="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Upgrade Alert Banner -->
        {#if node.is_upgrade_needed}
            <div
                class="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-4 animate-pulse-slow"
            >
                <div class="p-2 bg-destructive/20 rounded-lg text-destructive">
                    <AlertTriangle size={20} />
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h4
                            class="text-sm font-black text-destructive uppercase tracking-wider"
                        >
                            Infrastructure Upgrade Recommended
                        </h4>
                        <span
                            class="px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-destructive/20 text-destructive border-destructive/30"
                        >
                            Critical
                        </span>
                    </div>
                    <p class="text-xs text-foreground font-medium opacity-80">
                        This node is running an outdated version. Please update
                        to ensure optimal performance and security.
                    </p>
                </div>
            </div>
        {/if}

        <!-- Top Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Identity Card -->
            <div
                class="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group"
            >
                <!-- Glow Effect -->
                <div
                    class="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"
                ></div>

                <h3
                    class="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center"
                >
                    <Server size={14} class="mr-3 text-primary" /> Node Identity
                </h3>
                <div class="space-y-5 relative z-10">
                    <div class="group/field">
                        <span
                            class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                            >Public Key & Network</span
                        >
                        <div class="flex items-center gap-2 mt-2">
                            <div
                                class="flex-1 font-mono text-xs break-all bg-secondary/50 p-3 rounded-xl border border-border select-all"
                            >
                                {node.pubkey}
                            </div>
                            <div
                                class={`px-4 py-3 rounded-xl border font-black uppercase tracking-widest text-[10px] ${node.network === "mainnet" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"}`}
                            >
                                {node.network}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <h4
                                class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                            >
                                Endpoints
                            </h4>
                            <div class="flex flex-col gap-1.5 mt-2">
                                <div
                                    class="font-mono text-xs text-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border w-fit"
                                >
                                    {node.ip || "N/A"}:{node.port}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4
                                class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                            >
                                Environment
                            </h4>
                            <div class="flex flex-col gap-2 mt-2">
                                <div
                                    class="flex items-center justify-between text-xs bg-secondary/50 px-3 py-1.5 rounded-lg border border-border"
                                >
                                    <span class="text-muted-foreground"
                                        >Version</span
                                    >
                                    <span
                                        class="font-mono font-bold text-foreground"
                                        >{node.version}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <div
                            class="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-colors duration-300 hover:bg-primary/10"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="p-2 bg-primary/20 rounded-lg text-primary"
                                >
                                    <Zap size={14} />
                                </div>
                                <span
                                    class="text-xs font-black uppercase tracking-wider text-foreground opacity-80"
                                    >Response Latency</span
                                >
                            </div>
                            <span
                                class="font-mono text-lg font-black text-primary tracking-tighter"
                                >{node.response_time ?? 0}
                                <span
                                    class="text-[10px] uppercase font-bold opacity-60"
                                    >ms</span
                                ></span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resources & Metrics -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Stacked Cards for CPU, RAM, Storage with Backround Charts -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <!-- CPU Card -->
                    <div
                        class="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500 h-[220px] flex flex-col"
                    >
                        <!-- Chart Background (Simplified SVG or LayerChart in future, using placeholder CSS gradient for 'wow' factor parity if chart data unavailable or simple) -->
                        <div
                            class="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none"
                        >
                            <!-- We can put a small LayerChart here if we have data, otherwise visual flourish -->
                            {#if history.length > 0}
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d={createChartPath(
                                            history,
                                            "cpu",
                                            100,
                                            100,
                                            { fill: true },
                                        )}
                                        fill="var(--color-primary)"
                                        opacity="0.2"
                                    />
                                    <path
                                        d={createChartPath(
                                            history,
                                            "cpu",
                                            100,
                                            100,
                                            { fill: false },
                                        )}
                                        fill="none"
                                        stroke="var(--color-primary)"
                                        stroke-width="2"
                                    />
                                </svg>
                            {/if}
                        </div>

                        <div class="relative z-10 flex flex-col h-full">
                            <div
                                class="flex justify-between items-start mb-auto"
                            >
                                <div
                                    class="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500"
                                >
                                    <Cpu size={20} />
                                </div>
                                <div class="text-right">
                                    <span
                                        class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                                        >Avg Load</span
                                    >
                                    <div
                                        class="text-sm font-black text-foreground tracking-tighter"
                                    >
                                        {(
                                            (node.performance_score ?? 0) * 0.9
                                        ).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <p
                                    class="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 opacity-70"
                                >
                                    CPU Utilization
                                </p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <h3
                                        class="text-3xl font-black text-foreground font-mono tracking-tighter"
                                    >
                                        {(node.performance_score ?? 0).toFixed(
                                            1,
                                        )}<span class="text-lg opacity-40 ml-1"
                                            >%</span
                                        >
                                    </h3>
                                </div>
                                <div
                                    class="w-full h-2 bg-secondary/10 rounded-full overflow-hidden backdrop-blur-sm border border-secondary/10"
                                >
                                    <div
                                        class="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 ease-out"
                                        style={`width: ${node.performance_score ?? 0}%`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RAM Card -->
                    <div
                        class="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-secondary/40 transition-all duration-500 h-[220px] flex flex-col"
                    >
                        <div
                            class="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none"
                        >
                            {#if history.length > 0}
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d={createChartPath(
                                            history,
                                            "ram",
                                            100,
                                            100,
                                            { fill: true },
                                        )}
                                        fill="var(--color-secondary)"
                                        opacity="0.2"
                                    />
                                    <path
                                        d={createChartPath(
                                            history,
                                            "ram",
                                            100,
                                            100,
                                            { fill: false },
                                        )}
                                        fill="none"
                                        stroke="var(--color-secondary)"
                                        stroke-width="2"
                                    />
                                </svg>
                            {/if}
                        </div>
                        <div class="relative z-10 flex flex-col h-full">
                            <div
                                class="flex justify-between items-start mb-auto"
                            >
                                <div
                                    class="p-3 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 group-hover:scale-110 transition-transform duration-500"
                                >
                                    <Memory size={20} />
                                </div>
                                <div class="text-right">
                                    <span
                                        class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                                        >Total Memory</span
                                    >
                                    <div
                                        class="text-sm font-black text-foreground tracking-tighter"
                                    >
                                        {formatBytes(node.ram_total ?? 0)}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <p
                                    class="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 opacity-70"
                                >
                                    RAM Consumption
                                </p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <h3
                                        class="text-3xl font-black text-foreground font-mono tracking-tighter truncate"
                                    >
                                        {formatBytes(node.ram_used ?? 0)}
                                    </h3>
                                </div>
                                <div
                                    class="w-full h-2 bg-secondary/10 rounded-full overflow-hidden backdrop-blur-sm border border-secondary/10"
                                >
                                    <div
                                        class="h-full bg-gradient-to-r from-secondary to-secondary/60 transition-all duration-1000 ease-out"
                                        style={`width: ${node.ram_total ? ((node.ram_used ?? 0) / node.ram_total) * 100 : 0}%`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Storage Card -->
                    <div
                        class="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-accent/40 transition-all duration-500 h-[220px] flex flex-col"
                    >
                        <div
                            class="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none"
                        >
                            {#if history.length > 0}
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d={createChartPath(
                                            history,
                                            "storage",
                                            100,
                                            100,
                                            { fill: true },
                                        )}
                                        fill="var(--color-accent)"
                                        opacity="0.2"
                                    />
                                    <path
                                        d={createChartPath(
                                            history,
                                            "storage",
                                            100,
                                            100,
                                            { fill: false },
                                        )}
                                        fill="none"
                                        stroke="var(--color-accent)"
                                        stroke-width="2"
                                    />
                                </svg>
                            {/if}
                        </div>
                        <div class="relative z-10 flex flex-col h-full">
                            <div
                                class="flex justify-between items-start mb-auto"
                            >
                                <div
                                    class="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-110 transition-transform duration-500"
                                >
                                    <Layers size={20} />
                                </div>
                                <div class="text-right">
                                    <span
                                        class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                                        >Total Capacity</span
                                    >
                                    <div
                                        class="text-sm font-black text-foreground tracking-tighter"
                                    >
                                        {formatBytes(node.storage_capacity)}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <p
                                    class="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 opacity-70"
                                >
                                    Storage Used
                                </p>
                                <div class="flex items-baseline gap-2 mb-4">
                                    <h3
                                        class="text-3xl font-black text-foreground font-mono tracking-tighter truncate"
                                    >
                                        {formatBytes(node.storage_used)}
                                    </h3>
                                    <span
                                        class="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/10"
                                    >
                                        {(
                                            (node.storage_usage_percent ?? 0) *
                                            100
                                        ).toFixed(1)}%
                                    </span>
                                </div>
                                <div
                                    class="w-full h-2 bg-secondary/10 rounded-full overflow-hidden backdrop-blur-sm border border-secondary/10"
                                >
                                    <div
                                        class="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-1000 ease-out"
                                        style={`width: ${(node.storage_usage_percent ?? 0) * 100}%`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Metrics Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricCard
                        label="Total Credits"
                        value={(node.credits ?? 0).toLocaleString()}
                        icon={Coins}
                        variant="success"
                        trendText="Lifetime"
                        subtext={node.network === "both"
                            ? `Dev: ${(node.devnet_credits ?? 0).toLocaleString()} | Main: ${(node.mainnet_credits ?? 0).toLocaleString()}`
                            : "XAND Earned"}
                    />
                    <MetricCard
                        label="Node Status"
                        value={node.status === "active" ||
                        node.status === "online"
                            ? "Connected"
                            : "Disconnected"}
                        icon={Network}
                        variant={node.status === "active" ||
                        node.status === "online"
                            ? "success"
                            : "error"}
                        trendText={node.status}
                        subtext={`Source: ${node.network || "Unknown"}`}
                    />
                </div>

                <!-- Map Location -->
                <div
                    class="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group"
                >
                    <div
                        class="absolute -top-12 -right-12 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors duration-700"
                    ></div>

                    <h3
                        class="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center"
                    >
                        <Globe size={14} class="mr-3 text-accent" /> Physical Location
                    </h3>
                    {#if node.lat && node.lon}
                        <div
                            class="flex-1 min-h-[180px] mb-6 rounded-2xl overflow-hidden border border-border relative z-10"
                        >
                            <MiniMap lat={node.lat} lon={node.lon} />
                        </div>
                        <div
                            class="grid grid-cols-2 gap-4 text-sm border-t border-border pt-5 relative z-10"
                        >
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                                    >Country</span
                                >
                                <span
                                    class="font-black text-foreground tracking-tight"
                                    >{node.country}</span
                                >
                            </div>
                            <div class="flex flex-col gap-1 text-right">
                                <span
                                    class="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60"
                                    >City</span
                                >
                                <span
                                    class="font-black text-foreground tracking-tight"
                                    >{node.city}</span
                                >
                            </div>
                        </div>
                    {:else}
                        <div
                            class="flex-1 min-h-[180px] flex items-center justify-center text-muted-foreground text-sm italic opacity-50 relative z-10"
                        >
                            Location data unavailable
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- History Chart (Main) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
                class="bg-card border border-border rounded-3xl p-8 shadow-xl h-[400px] flex flex-col relative overflow-hidden group hover:border-primary/20 transition-all duration-500"
            >
                <div
                    class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2"
                ></div>

                <div
                    class="flex justify-between items-center mb-8 relative z-10"
                >
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-primary/10 rounded-lg text-primary">
                            <Activity size={16} />
                        </div>
                        <h3
                            class="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]"
                        >
                            Resource History (24h)
                        </h3>
                    </div>
                    {#if historyLoading}
                        <Loader2 class="w-4 h-4 animate-spin text-primary" />
                    {/if}
                </div>

                <div class="flex-1 w-full min-h-0 relative z-10">
                    {#if history.length > 0}
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 500 200"
                            preserveAspectRatio="none"
                        >
                            <path
                                d={createChartPath(
                                    history,
                                    "latency",
                                    500,
                                    200,
                                    { fill: true },
                                )}
                                fill="var(--color-primary)"
                                opacity="0.1"
                            />
                            <path
                                d={createChartPath(
                                    history,
                                    "latency",
                                    500,
                                    200,
                                    { fill: false },
                                )}
                                fill="none"
                                stroke="var(--color-primary)"
                                stroke-width="2"
                            />
                        </svg>
                    {:else}
                        <div
                            class="w-full h-full flex items-center justify-center text-muted-foreground text-xs"
                        >
                            No history data
                        </div>
                    {/if}
                </div>
            </div>

            <!-- JSON View -->
            <div
                class="bg-card border border-border rounded-3xl p-0 shadow-xl overflow-hidden h-[400px] flex flex-col"
            >
                <div
                    class="p-6 border-b border-border bg-muted/30 flex justify-between items-center"
                >
                    <h3
                        class="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center"
                    >
                        <Code size={16} class="mr-3 text-secondary" /> JSON Response
                    </h3>
                    <button
                        on:click={handleCopy}
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:brightness-110"
                    >
                        {#if copied}
                            <Check size={12} />
                        {:else}
                            <Copy size={12} />
                        {/if}
                        {copied ? "COPIED" : "COPY"}
                    </button>
                </div>
                <div
                    class="flex-1 p-6 bg-black/40 overflow-auto custom-scrollbar"
                >
                    <pre
                        class="font-mono text-[11px] text-blue-300 leading-relaxed">
                    {JSON.stringify(node, null, 2)}
                </pre>
                </div>
            </div>
        </div>
    </div>
</div>
