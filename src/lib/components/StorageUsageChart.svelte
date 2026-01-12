<script lang="ts">
    import { onMount } from "svelte";
    import { Chart, Svg, Group, Rect, Text } from "layerchart";
    import { scaleLinear, scaleBand } from "d3-scale";
    import { formatBytes } from "$utils/formatUtils";

    export let totalBytes: number;
    export let usedBytes: number;

    $: utilization = totalBytes > 0 ? usedBytes / totalBytes : 0;
    $: freeBytes = totalBytes - usedBytes;

    // Simple data for bar chart since LayerChart is overkill for a single progress bar,
    // but we might want to visualize distribution later.
    // For now, let's make a nice progress visualization similar to the React component
    // which seemed to usage a custom UI or Recharts Pie/Bar.
    // Let's implement a clean SVG-based gauge/bar using Svelte + SVG directly for simplicity and control unless complex.
    // Actually, let's stick to the brief and use Svelte.

    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    $: strokeDashoffset = circumference - utilization * circumference;

    // Color logic
    $: colorClass =
        utilization > 0.9
            ? "text-red-500"
            : utilization > 0.75
              ? "text-yellow-500"
              : "text-primary";
</script>

<div
    class="bg-card border border-border rounded-3xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden shadow-lg"
>
    <h3
        class="text-lg font-black text-foreground mb-6 self-start flex items-center gap-2"
    >
        STORAGE UTILIZATION
    </h3>

    <div class="relative flex items-center justify-center">
        <svg
            height={radius * 2}
            width={radius * 2}
            class="transform -rotate-90 origin-center"
        >
            <circle
                class="text-muted/20"
                stroke-width={stroke}
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                class={`${colorClass} transition-all duration-1000 ease-out`}
                stroke-width={stroke}
                stroke-dasharray={circumference + " " + circumference}
                style="stroke-dashoffset: {strokeDashoffset}"
                stroke-linecap="round"
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
        </svg>
        <div
            class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
            <span class="text-3xl font-black font-mono tracking-tighter">
                {(utilization * 100).toFixed(1)}%
            </span>
            <span
                class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1"
            >
                Used
            </span>
        </div>
    </div>

    <div class="w-full mt-8 grid grid-cols-2 gap-4">
        <div
            class="p-3 bg-secondary/50 rounded-xl border border-border flex flex-col items-center"
        >
            <span
                class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1"
                >Total</span
            >
            <span class="text-sm font-black font-mono"
                >{formatBytes(totalBytes)}</span
            >
        </div>
        <div
            class="p-3 bg-secondary/50 rounded-xl border border-border flex flex-col items-center"
        >
            <span
                class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1"
                >Free</span
            >
            <span class="text-sm font-black font-mono"
                >{formatBytes(freeBytes)}</span
            >
        </div>
    </div>
</div>
