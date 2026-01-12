<script lang="ts">
    import { type ComponentType } from "svelte";
    import clsx from "clsx";

    export let label: string;
    export let value: string | number;
    export let subtext: string | undefined = undefined;

    // "primary" | "secondary" | "accent" | "neutral" | "custom"
    // We will use specific gradients based on the design
    export let variant: string = "neutral";

    // For progress vars
    export let progress: number | undefined = undefined;
    export let progressColor: string = "bg-primary";

    // Custom content slot check
    export let useSlot: boolean = false;

    $: containerClass = clsx(
        "relative overflow-hidden rounded-2xl p-5 border border-white/5 shadow-lg min-h-[140px] flex flex-col justify-between transition-all duration-300 hover:border-white/10 group",
        {
            "bg-gradient-to-br from-[#1a1f36] to-[#0f111a]":
                variant === "neutral", // Dark/Standard
            "bg-gradient-to-br from-[#1a1f36] to-[#0f111a] border-primary/20":
                variant === "primary", // Blueish
            "bg-gradient-to-br from-[#1a1f36] to-[#0f111a] border-emerald-500/20":
                variant === "success", // Greenish
            // Add more specific gradients if needed to match image exactly
        },
    );

    $: valueClass = clsx(
        "text-4xl font-black tracking-tighter text-white/95", // Big white text
        {
            // Text color overrides if needed
        },
    );
</script>

<div class={containerClass}>
    <!-- Subtle Glow Background -->
    {#if variant === "primary"}
        <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"
        ></div>
    {:else if variant === "success"}
        <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"
        ></div>
    {:else}
        <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-white/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-white/10 transition-all duration-500"
        ></div>
    {/if}

    <div class="relative z-10 w-full h-full flex flex-col justify-between">
        <div>
            <h3
                class="text-sm font-medium text-white/50 uppercase tracking-wide mb-2"
            >
                {label}
            </h3>

            {#if useSlot}
                <slot />
            {:else}
                <div class="flex items-baseline gap-2">
                    <span class={valueClass}>{value}</span>
                    {#if subtext}
                        <span class="text-sm font-medium text-white/40"
                            >{subtext}</span
                        >
                    {/if}
                </div>
            {/if}
        </div>

        {#if progress !== undefined}
            <div class="mt-4">
                <div
                    class="flex justify-between text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wider"
                >
                    <span>Usage</span>
                    <span>{progress}%</span>
                </div>
                <div
                    class="h-2 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm"
                >
                    <div
                        class={clsx(
                            "h-full transition-all duration-1000 ease-out rounded-full",
                            progressColor,
                        )}
                        style={`width: ${progress}%`}
                    ></div>
                </div>
            </div>
        {/if}
    </div>
</div>
