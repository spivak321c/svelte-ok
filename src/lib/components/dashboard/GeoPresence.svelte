<script lang="ts">
    import { Globe, RefreshCw } from "lucide-svelte";
    import clsx from "clsx";

    export let distribution: { name: string; value: number }[];
    export let totalNodes: number;

    const COLORS = ["#933481", "#008E7C", "#FE8300", "#D1D1D6", "#6E6E7E"];

    // Calculate SVG paths for pie slices
    function getPieData(data: { name: string; value: number }[]) {
        let total = data.reduce((a, b) => a + b.value, 0);
        let startAngle = 0;

        return data.map((d, i) => {
            const angle = (d.value / total) * 360;
            const endAngle = startAngle + angle;

            const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

            // Large arc flag
            const largeArc = angle > 180 ? 1 : 0;

            const path = `M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`;

            startAngle = endAngle;
            return { ...d, path, color: COLORS[i % COLORS.length] };
        });
    }

    $: pieSlices = getPieData(distribution || []);
</script>

<div
    class="bg-card border border-border rounded-3xl p-8 lg:col-span-1 shadow-xl relative overflow-hidden flex flex-col"
>
    <div class="space-y-1 mb-8">
        <h3
            class="text-xl font-black text-foreground flex items-center tracking-tight"
        >
            <Globe class="w-5 h-5 mr-3 text-primary" />
            Geo-Presence
        </h3>
        <p class="text-xs text-muted-foreground font-medium ml-8">
            Regional node dispersion
        </p>
    </div>

    <div
        class="flex-1 min-h-[220px] w-full flex items-center justify-center relative"
    >
        <div
            class="absolute inset-0 flex items-center justify-center flex-col pointer-events-none z-10"
        >
            <span class="text-4xl font-black text-foreground tracking-tighter"
                >{totalNodes}</span
            >
            <span
                class="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1"
                >Total Nodes</span
            >
        </div>

        <div class="w-full h-full max-w-[200px] max-h-[200px]">
            <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                {#each pieSlices as slice}
                    <path
                        d={slice.path}
                        fill={slice.color}
                        class="hover:opacity-80 transition-opacity cursor-pointer stroke-background stroke-2"
                    >
                        <title>{slice.name}: {slice.value}</title>
                    </path>
                {/each}
                <!-- Inner circle for donut effect -->
                <circle cx="50" cy="50" r="35" class="fill-card" />
            </svg>
        </div>
    </div>

    <div
        class="flex flex-wrap justify-center gap-x-5 gap-y-3 mt-8 pt-6 border-t border-border/50"
    >
        {#each pieSlices as slice}
            <div
                class="flex items-center text-[10px] bg-background/30 px-2 py-1 rounded-lg border border-border/30 shadow-sm"
            >
                <div
                    class="w-2.5 h-2.5 rounded-full mr-2 shadow-inner"
                    style="background-color: {slice.color}"
                />
                <span class="text-muted-foreground font-black tracking-tight"
                    >{slice.name}</span
                >
            </div>
        {/each}
    </div>
</div>
