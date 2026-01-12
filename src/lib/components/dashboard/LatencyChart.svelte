<script lang="ts">
    import { Wifi, Loader2, ChevronUp } from "lucide-svelte";
    import { fade } from "svelte/transition";

    export let distribution: { range: string; count: number }[] | null = null;
    export let onClose: () => void;

    // Colors mimicking the React version
    const COLORS = ["#933481", "#008E7C", "#FE8300", "#D1D1D6", "#6E6E7E"];

    $: maxCount = distribution
        ? Math.max(...distribution.map((d) => d.count))
        : 0;

    // Simple bar calculation
    $: bars = distribution
        ? distribution.map((d, i) => ({
              ...d,
              heightPercent: maxCount > 0 ? (d.count / maxCount) * 100 : 0,
              color: COLORS[i % COLORS.length],
          }))
        : [];
</script>

<div
    class="lg:col-span-2 bg-card border border-border rounded-3xl p-8 flex flex-col h-[400px] lg:h-auto shadow-xl relative overflow-hidden group"
>
    <div
        class="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    ></div>

    <div class="flex justify-between items-center mb-8 relative z-10">
        <div class="space-y-1">
            <h3
                class="text-xl font-black text-foreground flex items-center tracking-tight"
            >
                <Wifi class="w-5 h-5 mr-3 text-primary" />
                Latency Distribution
            </h3>
            <p class="text-xs text-muted-foreground font-medium ml-8">
                Global request response times
            </p>
        </div>
        <div class="flex items-center gap-3">
            <div
                class="bg-background/50 backdrop-blur-sm rounded-xl p-1 flex text-[10px] font-black uppercase tracking-tighter border border-border shadow-inner"
            >
                <button
                    class="px-4 py-1.5 bg-card shadow-md rounded-lg text-primary border border-primary/20"
                    >Log</button
                >
                <button
                    class="px-4 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >Linear</button
                >
            </div>
            <button
                on:click={onClose}
                class="p-2.5 hover:bg-muted/50 rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            >
                <ChevronUp size={20} />
            </button>
        </div>
    </div>

    <div class="flex-1 w-full min-h-0 relative z-10">
        {#if distribution}
            <div
                class="w-full h-full flex items-end justify-between gap-2 pt-6 pb-2 px-2"
            >
                {#each bars as bar}
                    <div
                        class="flex-1 flex flex-col items-center justify-end h-full group/bar relative"
                    >
                        <!-- Tooltip Area -->
                        <div
                            class="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-border pointer-events-none whitespace-nowrap z-20"
                        >
                            {bar.range}: {bar.count}
                        </div>

                        <!-- Bar -->
                        <div
                            class="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                            style="height: {bar.heightPercent}%; background-color: {bar.color};"
                        ></div>

                        <!-- Label -->
                        <div
                            class="mt-2 text-[10px] font-bold text-muted-foreground -rotate-45 origin-left translate-y-2 opacity-60"
                        >
                            {bar.range}
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div
                class="flex items-center justify-center h-full text-muted-foreground font-bold animate-pulse"
            >
                <Loader2 class="w-8 h-8 animate-spin mr-3 text-primary" /> Synchronizing...
            </div>
        {/if}
    </div>
</div>
