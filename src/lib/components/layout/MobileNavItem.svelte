<script lang="ts">
    import { page } from "$app/stores";
    import { type ComponentType } from "svelte";

    export let href: string;
    export let label: string;
    export let icon: ComponentType;
    export let onClick: () => void;

    $: isActive =
        $page.url.pathname === href ||
        ($page.url.pathname.startsWith(href) && href !== "/");
</script>

<a
    {href}
    on:click={onClick}
    class={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
        isActive
            ? "text-white bg-primary shadow-lg shadow-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
>
    <div
        class={`transition-transform duration-200 relative z-10 ${isActive ? "text-white" : "group-hover:text-primary"}`}
    >
        <svelte:component this={icon} size={20} />
    </div>
    <span class="ml-3 font-medium text-sm tracking-wide relative z-10"
        >{label}</span
    >
</a>
