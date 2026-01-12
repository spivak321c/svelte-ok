<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        MapPin,
        Clock,
        Zap,
        Activity,
        HardDrive,
        ShieldCheck,
        Server,
        Trophy,
        Info,
        TrendingUp,
        Database,
        ExternalLink,
        BarChart2,
        PlayCircle,
        AlertTriangle,
    } from "lucide-svelte";
    import type { PNode } from "$types";
    import { goto } from "$app/navigation";

    export let node: PNode;
    export let rank: number | undefined = undefined;
    export let score: number | undefined = undefined;
    export let listMode: boolean = false;

    const dispatch = createEventDispatcher();

    // Status Badge
    $: statusConfig = (() => {
        if (node.status === "active" || node.status === "online") {
            return {
                label: "Healthy",
                color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            };
        }
        if (node.status === "delinquent") {
            return {
                label: "Degraded",
                color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            };
        }
        return {
            label: "Offline",
            color: "bg-red-500/10 text-red-500 border-red-500/20",
        };
    })();

    // Network Badge
    $: networkConfig = (() => {
        switch (node.network) {
            case "mainnet":
                return {
                    label: "Mainnet",
                    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                };
            case "devnet":
                return {
                    label: "Devnet",
                    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                };
            case "both":
                return {
                    label: "Hybrid",
                    color: "bg-gradient-to-r from-orange-500/10 to-indigo-500/10 text-transparent bg-clip-text font-black border-indigo-500/20",
                };
            default:
                return {
                    label: "Unknown",
                    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
                };
        }
    })();

    // Performance & Latency
    $: performanceScore = node.performance_score ?? 0;
    $: uptimeScore = node.uptime_score ?? 0;

    $: latencyQuality = (() => {
        const ms = node.response_time ?? 0;
        if (ms < 150)
            return {
                label: "Good",
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            };
        if (ms < 300)
            return {
                label: "Average",
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            };
        return {
            label: "Poor",
            color: "text-red-500 bg-red-500/10 border-red-500/20",
        };
    })();

    // Reason Badges
    $: reasonBadges = (() => {
        const badges = [];
        if ((node.response_time ?? 1000) < 100) {
            badges.push({
                label: "Low Latency",
                icon: Zap,
                color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            });
        }
        if ((node.uptime_score ?? 0) > 98) {
            badges.push({
                label: "High Availability",
                icon: ShieldCheck,
                color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            });
        }
        if ((node.storage_usage_percent ?? 0) < 0.3) {
            badges.push({
                label: "Underutilized",
                icon: Database,
                color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            });
        }
        if (node.status === "active" || node.status === "online") {
            badges.push({
                label: "Healthy",
                icon: TrendingUp,
                color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            });
        }
        if (node.is_upgrade_needed) {
            // Check if this property exists in PNode (added loosely in React)
            badges.push({
                label: "Update Required",
                icon: AlertTriangle,
                color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            });
        }
        return badges.slice(0, 2);
    })();

    function getRelativeTime(timestamp?: string | number) {
        if (!timestamp) return "Unknown";
        const then = new Date(timestamp).getTime();
        const now = Date.now();
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    const isTopTier = (node as any).isTopTier; // Cast if not in stricter PNode

    export let autoNavigate: boolean = true;

    function handleCardClick() {
        if (autoNavigate) {
            goto(`/nodes/${node.pubkey}`); // Navigation
        }
        dispatch("click", node);
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    on:click={handleCardClick}
    role="button"
    tabindex="0"
    class={`
        group relative bg-card border rounded-2xl p-5 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col
        ${listMode ? "flex-row items-center gap-6 min-h-[100px]" : "min-h-[260px]"}
        ${isTopTier ? "ring-1 ring-primary/40 border-primary/30 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-primary/5" : "border-border"}
        ${node.is_upgrade_needed ? "border-rose-500/40 shadow-lg shadow-rose-500/5" : ""}
    `}
>
    {#if isTopTier && !listMode}
        <div class="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
            <div
                class="flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black uppercase rounded-full shadow-md shadow-primary/20"
            >
                <TrendingUp size={8} /> Verified Top Tier
            </div>
        </div>
    {/if}

    <!-- Header Area -->
    <div
        class={`flex items-start justify-between ${listMode ? "w-1/3" : "mb-3"}`}
    >
        <div class="flex items-center gap-3 min-w-0">
            <div
                class="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0 shadow-sm group-hover:border-primary/50 transition-colors"
            >
                {node.pubkey.substring(0, 2).toUpperCase()}
            </div>
            <div class="min-w-0">
                <h3 class="text-sm font-bold text-foreground truncate mb-0.5">
                    Node {node.pubkey.substring(0, 4)}...{node.pubkey.substring(
                        node.pubkey.length - 4,
                    )}
                </h3>
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                        class={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-tighter ${statusConfig.color}`}
                    >
                        {statusConfig.label}
                    </span>
                    <span
                        class={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-tighter ${networkConfig.color}`}
                    >
                        {networkConfig.label}
                    </span>
                    {#if rank}
                        <span
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-[9px]"
                        >
                            <Trophy size={8} />
                            #{rank}
                        </span>
                    {/if}
                </div>
            </div>
        </div>

        {#if !listMode}
            <div class="flex flex-col items-end">
                <div
                    class="text-2xl font-black text-primary leading-none tracking-tighter flex items-baseline"
                >
                    {score ?? performanceScore}
                    <span
                        class="text-[10px] text-muted-foreground font-medium ml-0.5 uppercase tracking-normal"
                        >Pts</span
                    >
                </div>
                <div
                    class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 flex items-center gap-1"
                >
                    Node Score
                    <Info size={8} class="text-muted-foreground/50" />
                </div>
            </div>
        {/if}
    </div>

    <!-- Reason Badges (Grid only) -->
    {#if !listMode}
        <div class="flex flex-wrap gap-1.5 mb-3">
            {#each reasonBadges as badge}
                <div
                    class={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${badge.color}`}
                >
                    <svelte:component this={badge.icon} size={10} />
                    {badge.label}
                </div>
            {/each}
        </div>
    {/if}

    <!-- Info Section -->
    <div
        class={`${listMode ? "grid grid-cols-2 gap-4 flex-1" : "grid grid-cols-2 gap-2 mb-3 bg-secondary/30 rounded-xl p-2.5 border border-border/50"}`}
    >
        <div class="min-w-0">
            <div
                class="text-[8px] text-muted-foreground uppercase font-bold mb-0.5"
            >
                Address
            </div>
            <div
                class="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/90 truncate"
            >
                <Server size={10} class="text-muted-foreground flex-shrink-0" />
                {node.ip}:{node.port}
            </div>
        </div>
        <div class="min-w-0">
            <div
                class="text-[8px] text-muted-foreground uppercase font-bold mb-0.5"
            >
                Location
            </div>
            <div
                class="flex items-center gap-1.5 text-[11px] text-muted-foreground/90 truncate"
            >
                <MapPin size={10} class="text-muted-foreground flex-shrink-0" />
                {node.city || "Unknown"}
            </div>
        </div>
    </div>

    <!-- Stats Bars (Grid Only mostly, simplified for list) -->
    {#if !listMode}
        <div class="space-y-2.5 flex-1">
            <div>
                <div class="flex items-center justify-between mb-1">
                    <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight"
                        >System Performance</span
                    >
                    <span
                        class={`text-[10px] font-black ${
                            performanceScore >= 90
                                ? "text-emerald-500"
                                : performanceScore >= 70
                                  ? "text-amber-500"
                                  : "text-red-500"
                        }`}
                    >
                        {performanceScore}%
                    </span>
                </div>
                <div class="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        class={`h-full rounded-full transition-all duration-500 ${
                            performanceScore >= 90
                                ? "bg-emerald-500"
                                : performanceScore >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                        }`}
                        style={`width: ${performanceScore}%`}
                    />
                </div>
            </div>
            <div>
                <div class="flex items-center justify-between mb-1">
                    <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight"
                        >Storage</span
                    >
                    <span class="text-[10px] font-black text-foreground">
                        {((node.storage_usage_percent ?? 0) * 100).toFixed(0)}%
                    </span>
                </div>
                <div class="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        class="h-full bg-primary rounded-full transition-all duration-500"
                        style={`width: ${(node.storage_usage_percent ?? 0) * 100}%`}
                    />
                </div>
            </div>
            <div
                class="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[9px] text-muted-foreground font-medium"
            >
                <span class="flex items-center gap-1">
                    <Clock size={10} />
                    {getRelativeTime(node.last_seen)}
                </span>
                <span class="font-mono opacity-50"
                    >v{node.version?.split("-")[0] || "?"}</span
                >
            </div>
        </div>
    {:else}
        <!-- List Mode Extra Stats -->
        <div class="w-1/4 flex flex-col gap-1 items-end">
            <div
                class={`inline-flex items-center justify-center py-1 px-2 rounded-lg border text-[10px] font-black uppercase text-center ${latencyQuality.color}`}
            >
                {latencyQuality.label} ({node.response_time ?? 0}ms)
            </div>
            <span
                class="flex items-center gap-1 text-[9px] text-muted-foreground"
            >
                <Clock size={10} />
                {getRelativeTime(node.last_seen)}
            </span>
        </div>
    {/if}
</div>
