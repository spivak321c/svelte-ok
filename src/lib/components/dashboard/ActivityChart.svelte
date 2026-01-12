<script lang="ts">
    import { scaleLinear, scaleTime } from "d3-scale";
    import { area, curveMonotoneX } from "d3-shape";
    import { extent, max } from "d3-array";
    import { RefreshCw } from "lucide-svelte";
    import { onMount, tick } from "svelte";

    // Mock data type, replace with real history point type
    type DataPoint = { time: number; value: number };

    export let data: DataPoint[] = [];
    export let height = 300;
    export let label = "Last Seen Activity (12h)";

    let width = 0;

    // Generate some mock previous data if real data is sparse for better visualization
    // (In real app, backend would provide full history)

    $: xDomain = extent(data, (d) => d.time) as [number, number];
    $: yMax = max(data, (d) => d.value) || 10;
    $: yDomain = [0, yMax * 1.2];

    $: xScale = scaleTime().domain(xDomain).range([0, width]);
    $: yScale = scaleLinear().domain(yDomain).range([height, 0]);

    $: areaPath = area<DataPoint>()
        .x((d) => xScale(d.time))
        .y0(height)
        .y1((d) => yScale(d.value))
        .curve(curveMonotoneX)(data);

    $: linePath = area<DataPoint>()
        .x((d) => xScale(d.time))
        .y0((d) => yScale(d.value)) // Workaround for line: y0 = y1
        .y1((d) => yScale(d.value))
        .curve(curveMonotoneX)(data);

    // Simple filter buttons
    const filters = ["3h", "6h", "12h"];
    let activeFilter = "12h";
</script>

<div
    class="w-full bg-[#0f111a] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl group"
    bind:clientWidth={width}
>
    <!-- Background Grid -->
    <div
        class="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style="background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 40px 40px;"
    ></div>

    <!-- Header -->
    <div class="relative z-10 flex justify-between items-center mb-6">
        <h3 class="text-white/70 font-medium text-lg tracking-wide">{label}</h3>

        <div class="flex items-center gap-2">
            <div
                class="flex bg-[#1a1f36] rounded-lg p-0.5 border border-white/5"
            >
                {#each filters as filter}
                    <button
                        class={activeFilter === filter
                            ? "px-3 py-1 text-xs font-bold text-white bg-[#2d3748] rounded-[6px] shadow-sm transition-all"
                            : "px-3 py-1 text-xs font-medium text-white/40 hover:text-white transition-colors"}
                        on:click={() => (activeFilter = filter)}
                    >
                        {filter}
                    </button>
                {/each}
            </div>
            <button
                class="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
                <RefreshCw size={14} />
            </button>
        </div>
    </div>

    <!-- Chart -->
    <div class="relative z-10 h-[300px] w-full">
        {#if width > 0 && data.length > 0}
            <svg {width} {height} class="overflow-visible">
                <defs>
                    <linearGradient
                        id="chartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stop-color="#3b82f6"
                            stop-opacity="0.5"
                        />
                        <stop
                            offset="100%"
                            stop-color="#3b82f6"
                            stop-opacity="0"
                        />
                    </linearGradient>
                    <!-- Glow filter -->
                    <filter
                        id="glow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                    >
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <!-- Axis Lines (Simplified) -->
                {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                    <line
                        x1="0"
                        y1={height * tick}
                        x2={width}
                        y2={height * tick}
                        stroke="rgba(255,255,255,0.05)"
                        stroke-dasharray="4 4"
                    />
                {/each}

                <!-- Area -->
                <path
                    d={areaPath}
                    fill="url(#chartGradient)"
                    class="transition-all duration-1000 ease-in-out"
                />

                <!-- Line -->
                <path
                    d={linePath}
                    fill="none"
                    stroke="#60a5fa"
                    stroke-width="3"
                    filter="url(#glow)"
                    class="transition-all duration-1000 ease-in-out"
                />

                <!-- Tooltip Overlay - Simplified implementation -->
                <!-- A real implementation would track mouse coordinates to find nearest point -->
                <circle
                    cx={xScale(data[Math.floor(data.length / 2)].time)}
                    cy={yScale(data[Math.floor(data.length / 2)].value)}
                    r="4"
                    fill="#60a5fa"
                    stroke="white"
                    stroke-width="2"
                />

                <!-- Mock Tooltip Box -->
                <foreignObject
                    x={xScale(data[Math.floor(data.length / 2)].time) - 40}
                    y={yScale(data[Math.floor(data.length / 2)].value) - 60}
                    width="80"
                    height="40"
                >
                    <div
                        class="bg-[#1a1f36] border border-white/10 rounded px-2 py-1 text-[10px] text-center text-white shadow-xl"
                    >
                        {Math.round(data[Math.floor(data.length / 2)].value)} nodes
                    </div>
                    <div class="w-px h-6 bg-white/20 mx-auto mt-1"></div>
                </foreignObject>

                <!-- Time Labels -->
                {#each xScale.ticks(6) as t}
                    <text
                        x={xScale(t)}
                        y={height + 20}
                        text-anchor="middle"
                        font-size="10"
                        fill="rgba(255,255,255,0.4)"
                    >
                        {t.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </text>
                {/each}
            </svg>
        {/if}
    </div>
</div>
