<script lang="ts">
    import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-svelte";
    import { formatBytes } from "$utils/formatUtils";
    import clsx from "clsx";

    export let totalStorageBytes: number;
    export let usedStorageBytes: number;

    $: utilization =
        totalStorageBytes > 0
            ? (usedStorageBytes / totalStorageBytes) * 100
            : 0;

    // Simulation: Daily growth 0.5% of total or min 5TB
    $: dailyGrowthBytes = Math.max(
        5 * 1024 * 1024 * 1024 * 1024,
        totalStorageBytes * 0.005,
    );
    $: daysToFull =
        dailyGrowthBytes > 0
            ? (totalStorageBytes - usedStorageBytes) / dailyGrowthBytes
            : 999;
    $: needsNodes = utilization > 75 || daysToFull < 60;

    // Recommendations
    $: avgNodeStorageBytes = 50 * 1024 * 1024 * 1024 * 1024; // 50TB
    $: storageNeededBytes = dailyGrowthBytes * 30;
    $: recommendedNodes = Math.ceil(storageNeededBytes / avgNodeStorageBytes);

    $: currentPB = Math.floor(usedStorageBytes / 1e15);
    $: nextMilestoneBytes = (currentPB + 1) * 1e15;
    $: daysToMilestone =
        dailyGrowthBytes > 0
            ? (nextMilestoneBytes - usedStorageBytes) / dailyGrowthBytes
            : 0;

    // Chart Data Generation
    $: data = Array.from({ length: 30 }, (_, i) => {
        return usedStorageBytes + dailyGrowthBytes * i;
    });

    // SVG scaling
    let width = 100;
    let height = 50;
    $: maxY = totalStorageBytes * 1.1; // 10% buffer
    $: xScale = (i: number) => (i / (data.length - 1)) * 100;
    $: yScale = (val: number) => 100 - (val / maxY) * 100;

    $: points = data.map((val, i) => `${xScale(i)},${yScale(val)}`).join(" ");
    $: areaPath = `M0,100 L0,${yScale(data[0])} ${points.replace(/,/g, " ")} L100,${yScale(data[data.length - 1])} L100,100 Z`;
    $: linePath = `M0,${yScale(data[0])} ${points.replace(/,/g, " ")}`;

    $: capacityY = yScale(totalStorageBytes);
</script>

<div
    class="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row gap-6 shadow-xl relative overflow-hidden group"
>
    <!-- Decorative background -->
    <div
        class="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"
    ></div>

    <div class="flex-1 space-y-5 relative z-10">
        <div>
            <div class="flex items-center gap-3 mb-1">
                <div class="p-2 bg-primary/10 rounded-lg text-primary">
                    <TrendingUp size={20} />
                </div>
                <h3 class="text-xl font-black text-foreground tracking-tight">
                    Capacity Forecast
                </h3>
            </div>
            <p class="text-sm text-muted-foreground">
                Predictive projections for network scaling.
            </p>
        </div>

        <div
            class={clsx(
                "p-4 rounded-2xl border flex items-start gap-4",
                needsNodes
                    ? "bg-accent/5 border-accent/20"
                    : "bg-secondary/5 border-secondary/20",
            )}
        >
            <div
                class={clsx(
                    "p-2 rounded-xl",
                    needsNodes
                        ? "bg-accent/20 text-accent"
                        : "bg-secondary/20 text-secondary",
                )}
            >
                {#if needsNodes}
                    <AlertTriangle size={20} />
                {:else}
                    <CheckCircle size={20} />
                {/if}
            </div>
            <div>
                <h4
                    class={clsx(
                        "text-sm font-black uppercase tracking-wider",
                        needsNodes ? "text-accent" : "text-secondary",
                    )}
                >
                    {needsNodes ? "Expansion Recommended" : "Optimal Capacity"}
                </h4>
                <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {#if needsNodes}
                        Deploy <span class="font-bold text-accent"
                            >~{recommendedNodes} pNodes</span
                        >
                        within 30 days. Growth:
                        <span class="font-mono font-bold"
                            >{formatBytes(dailyGrowthBytes)}/day</span
                        >.
                    {:else}
                        Current growth <span class="font-mono font-bold"
                            >{formatBytes(dailyGrowthBytes)}/day</span
                        >
                        is healthy. Next milestone in
                        <span class="font-mono font-bold"
                            >{daysToMilestone.toFixed(0)} days</span
                        >.
                    {/if}
                </p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div
                class="bg-background/50 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-inner"
            >
                <div
                    class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2"
                >
                    Utilization
                </div>
                <div class="flex items-baseline gap-1">
                    <span
                        class={clsx(
                            "text-3xl font-black font-mono",
                            utilization > 80 ? "text-accent" : "text-primary",
                        )}>{utilization.toFixed(1)}</span
                    >
                    <span class="text-sm text-muted-foreground font-bold"
                        >%</span
                    >
                </div>
                <div
                    class="w-full h-1.5 bg-secondary/20 rounded-full mt-3 overflow-hidden"
                >
                    <div
                        class={clsx(
                            "h-full transition-all duration-1000",
                            utilization > 80 ? "bg-accent" : "bg-primary",
                        )}
                        style="width: {utilization}%"
                    ></div>
                </div>
            </div>
            <div
                class="bg-background/50 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-inner"
            >
                <div
                    class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2"
                >
                    Saturation
                </div>
                <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-black font-mono text-foreground"
                        >{daysToFull < 999
                            ? daysToFull.toFixed(0)
                            : ">999"}</span
                    >
                    <span class="text-sm text-muted-foreground font-bold"
                        >days</span
                    >
                </div>
                <p
                    class="text-[9px] text-muted-foreground mt-3 font-bold uppercase"
                >
                    Linear Projection
                </p>
            </div>
        </div>
    </div>

    <!-- Chart Section -->
    <div
        class="flex-1 min-h-[220px] bg-background/40 backdrop-blur-sm rounded-2xl border border-border p-5 relative z-10 shadow-inner flex flex-col"
    >
        <div class="flex justify-between items-center mb-4">
            <span
                class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]"
                >30-Day Growth Model</span
            >
            <div class="flex items-center gap-3 text-[10px] font-bold">
                <span class="flex items-center text-primary"
                    ><span
                        class="w-2 h-2 rounded-full bg-primary mr-1.5 shadow-[0_0_8px_var(--primary-rgb)]"
                    ></span> USED</span
                >
                <span class="flex items-center text-muted-foreground"
                    ><span class="w-2 h-2 rounded-full bg-muted mr-1.5"></span> CAPACITY</span
                >
            </div>
        </div>

        <div class="flex-1 relative w-full h-full min-h-[150px]">
            <svg
                class="w-full h-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <!-- Capacity Line -->
                <line
                    x1="0"
                    y1={capacityY}
                    x2="100"
                    y2={capacityY}
                    stroke="currentColor"
                    class="text-muted-foreground/30"
                    stroke-dasharray="2"
                    stroke-width="0.5"
                />

                <defs>
                    <linearGradient
                        id="chartGradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stop-color="currentColor"
                            class="text-primary"
                            stop-opacity="0.4"
                        />
                        <stop
                            offset="100%"
                            stop-color="currentColor"
                            class="text-primary"
                            stop-opacity="0"
                        />
                    </linearGradient>
                </defs>

                <!-- Area -->
                <path d={areaPath} fill="url(#chartGradient)" />

                <!-- Line -->
                <polyline
                    points={points.replace(/ /g, ",")}
                    fill="none"
                    class="text-primary"
                    stroke="currentColor"
                    stroke-width="1.5"
                    vector-effect="non-scaling-stroke"
                />
            </svg>
        </div>

        <!-- Legend/Grid indicators could be added here -->
    </div>
</div>
