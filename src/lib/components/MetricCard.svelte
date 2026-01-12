<script lang="ts">
    import { type ComponentType } from "svelte";
    import clsx from "clsx";
    import { Zap } from "lucide-svelte";

    export let label: string;
    export let value: string | number;
    export let subtext: string | undefined = undefined;
    export let icon: ComponentType;
    export let trend: number | undefined = undefined;
    export let trendText: string | undefined = undefined;
    export let variant:
        | "primary"
        | "secondary"
        | "accent"
        | "success"
        | "warning"
        | "error"
        | "neutral" = "neutral";
    export let loading: boolean = false;

    // Computed Styles
    $: variantStyles = (() => {
        switch (variant) {
            case "primary":
                return "border-primary/20 text-primary shadow-primary/5";
            case "secondary":
                return "border-secondary/20 text-secondary shadow-secondary/5";
            case "accent":
                return "border-accent/20 text-accent shadow-accent/5";
            case "success":
                return "border-emerald-500/20 text-emerald-500 shadow-emerald-500/5";
            case "warning":
                return "border-amber-500/20 text-amber-500 shadow-amber-500/5";
            case "error":
                return "border-red-500/20 text-red-500 shadow-red-500/5";
            default:
                return "border-muted text-muted-foreground";
        }
    })();

    $: iconBg = (() => {
        switch (variant) {
            case "primary":
                return "bg-primary/10 text-primary";
            case "secondary":
                return "bg-secondary/10 text-secondary";
            case "accent":
                return "bg-accent/10 text-accent";
            case "success":
                return "bg-emerald-500/10 text-emerald-500";
            case "warning":
                return "bg-amber-500/10 text-amber-500";
            case "error":
                return "bg-red-500/10 text-red-500";
            default:
                return "bg-secondary/50 text-foreground";
        }
    })();

    $: glowColor = (() => {
        switch (variant) {
            case "primary":
                return "bg-primary";
            case "secondary":
                return "bg-secondary";
            case "accent":
                return "bg-accent";
            case "success":
                return "bg-emerald-500";
            case "neutral":
                return "bg-primary/20"; // Default soft
            default:
                return "bg-primary";
        }
    })();
</script>

<div
    class={clsx(
        "bg-card border rounded-2xl p-5 relative overflow-hidden shadow-lg transition-all duration-300 group hover:border-primary/40 flex flex-col justify-between min-h-[160px]",
        variantStyles,
    )}
>
    <!-- Subtle Glow -->
    <div
        class={clsx(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none",
            glowColor,
        )}
    ></div>

    <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
            <div
                class={clsx(
                    "p-2.5 rounded-xl border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500",
                    iconBg,
                )}
            >
                <svelte:component this={icon} size={20} />
            </div>

            {#if trend !== undefined}
                <div
                    class={clsx(
                        "text-[10px] font-mono font-black flex items-center px-1.5 py-0.5 rounded-md border",
                        trend >= 0
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20",
                    )}
                >
                    <Zap size={10} class="mr-1" />
                    {trend > 0 ? "+" : ""}{trend}%
                </div>
            {/if}

            {#if trendText}
                <div
                    class="text-[9px] font-bold uppercase tracking-tight text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border"
                >
                    {trendText}
                </div>
            {/if}
        </div>

        <div>
            <p
                class="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5"
            >
                {label}
            </p>
            <div class="flex items-baseline gap-2">
                {#if loading}
                    <div class="h-8 w-24 bg-muted animate-pulse rounded-md" />
                {:else}
                    <h3
                        class="text-3xl font-black text-foreground font-mono tracking-tighter leading-none"
                    >
                        {value}
                    </h3>
                {/if}
            </div>
        </div>
    </div>

    <div class="relative z-10 mt-4">
        {#if subtext}
            <p
                class="text-muted-foreground text-[12px] font-bold flex items-center gap-1.5 mt-1"
            >
                <span
                    class="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"
                ></span>
                {subtext}
            </p>
        {/if}
    </div>
</div>
