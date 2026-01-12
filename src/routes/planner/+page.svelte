<script lang="ts">
    import { Calculator, Activity } from "lucide-svelte";
    import CostCalculator from "$lib/components/CostCalculator.svelte";
    import RedundancySimulator from "$lib/components/RedundancySimulator.svelte";
    import { fade } from "svelte/transition";

    let activeTab: "calculator" | "simulator" = "calculator";
</script>

<div
    class="h-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-500"
>
    <!-- Navigation Tabs -->
    <div
        class="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4"
    >
        <h1 class="text-xl font-bold text-foreground flex items-center">
            <Calculator class="w-6 h-6 mr-3 text-primary" />
            Storage Planner
        </h1>
        <div
            class="flex bg-card p-1 rounded-lg border border-border overflow-hidden"
        >
            <button
                on:click={() => (activeTab = "calculator")}
                class={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "calculator" ? "bg-background text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Calculator size={14} /> Cost & ROI Calculator
            </button>
            <button
                on:click={() => (activeTab = "simulator")}
                class={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "simulator" ? "bg-background text-secondary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Activity size={14} /> Redundancy Simulator
            </button>
        </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
        <div class="max-w-7xl mx-auto">
            {#if activeTab === "calculator"}
                <div in:fade={{ duration: 300, delay: 100 }}>
                    <CostCalculator />
                </div>
            {:else}
                <div in:fade={{ duration: 300, delay: 100 }}>
                    <RedundancySimulator />
                </div>
            {/if}
        </div>
    </div>
</div>
