<script lang="ts">
    import { page } from "$app/stores";
    import type { ComponentType } from "svelte";

    export let href: string;
    export let label: string;
    export let icon: ComponentType;

    // Check if exact match or sub-route match (for cases like /nodes/[id])
    $: isActive =
        $page.url.pathname === href ||
        ($page.url.pathname.startsWith(href) && href !== "/");
</script>

<a
    {href}
    class={`flex items-center px-4 py-2 rounded-full transition-all duration-200 group relative select-none border
    ${
        isActive
            ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
            : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
    }`}
>
    <div
        class={`transition-transform duration-200 ${isActive ? "scale-100" : "group-hover:scale-105"}`}
    >
        <svelte:component this={icon} size={18} />
    </div>
    <span
        class={`ml-2 font-medium text-xs tracking-wide whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}
    >
        {label}
    </span>
</a>
