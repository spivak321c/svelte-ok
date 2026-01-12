<script lang="ts">
    import { Layers } from "lucide-svelte";
    import type { PNode } from "$lib/types";
    import { goto } from "$app/navigation";

    export let nodes: PNode[] = [];
    export let onNavigateToNodes: () => void;

    type SortOption = "rank" | "latency" | "score" | "credit";
    let sortMetric: SortOption = "latency";
    const metrics: SortOption[] = ["credit", "latency", "score"];

    $: sortedNodes = [...nodes]
        .sort((a, b) => {
            if (sortMetric === "latency")
                return (a.response_time || 9999) - (b.response_time || 9999);
            if (sortMetric === "score")
                return (b.performance_score || 0) - (a.performance_score || 0);
            if (sortMetric === "credit")
                return (b.credits || 0) - (a.credits || 0);
            return 0;
        })
        .slice(0, 5);

    function getNodeColor(status: string) {
        switch (status.toLowerCase()) {
            case "active":
            case "online":
                return "bg-[#008E7C]";
            case "delinquent":
                return "bg-[#FE8300]";
            case "offline":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    }
</script>

<div
    class="bg-card border border-border rounded-3xl overflow-hidden lg:col-span-2 flex flex-col shadow-xl"
>
    <div
        class="px-8 py-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-secondary/5 backdrop-blur-sm"
    >
        <div class="space-y-1">
            <h3
                class="text-xl font-black text-foreground flex items-center tracking-tight"
            >
                <Layers class="w-5 h-5 mr-3 text-primary" />
                Performance Registry
            </h3>
            <p class="text-xs text-muted-foreground font-medium ml-8">
                Top performing infrastructure units
            </p>
        </div>

        <div class="flex items-center gap-4 self-stretch sm:self-auto">
            <div
                class="flex bg-background/50 backdrop-blur-sm rounded-xl p-1 border border-border shadow-inner"
            >
                {#each metrics as metric}
                    <button
                        on:click={() => (sortMetric = metric)}
                        class={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${sortMetric === metric ? "bg-card text-primary shadow-md border border-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {metric}
                    </button>
                {/each}
            </div>
            <button
                on:click={onNavigateToNodes}
                class="p-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all border border-primary/10 group"
                title="View Full Registry"
            >
                <Layers
                    size={18}
                    class="group-hover:scale-110 transition-transform"
                />
            </button>
        </div>
    </div>

    <div class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr
                    class="border-b border-border bg-background/30 text-[10px] uppercase font-black text-muted-foreground tracking-wider"
                >
                    <th class="px-6 py-4">Node</th>
                    <th class="px-6 py-4">Status</th>
                    <th class="px-6 py-4 text-right">Latency</th>
                    <th class="px-6 py-4 text-right">Score</th>
                    <th class="px-6 py-4 text-right">Credits</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedNodes as node}
                    <tr
                        class="border-b border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                        on:click={() => goto(`/nodes/${node.pubkey}`)}
                    >
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-[10px] font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors"
                                >
                                    {node.pubkey.substring(0, 2)}
                                </div>
                                <div>
                                    <div
                                        class="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors"
                                    >
                                        {node.pubkey.substring(0, 12)}...
                                    </div>
                                    <div
                                        class="text-[10px] text-muted-foreground"
                                    >
                                        {node.city ||
                                            node.country ||
                                            "Unknown Region"}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <span
                                    class={`w-2 h-2 rounded-full ${getNodeColor(node.status)} shadow-[0_0_5px_currentColor]`}
                                ></span>
                                <span
                                    class="text-xs font-bold text-muted-foreground uppercase"
                                    >{node.status}</span
                                >
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span
                                class="font-mono text-xs font-bold text-foreground"
                                >{node.response_time ?? "-"}</span
                            >
                            <span class="text-[10px] text-muted-foreground ml-1"
                                >ms</span
                            >
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div
                                class="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary font-bold text-xs"
                            >
                                {node.performance_score ?? "-"}
                            </div>
                        </td>
                        <td
                            class="px-6 py-4 text-right font-mono text-xs font-bold text-muted-foreground"
                        >
                            {node.credits?.toLocaleString() ?? "-"}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
