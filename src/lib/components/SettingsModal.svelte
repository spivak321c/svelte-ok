<script lang="ts">
    import { X, Save, RefreshCw, Moon, Sun, Globe } from "lucide-svelte";
    import { settings } from "$stores/settings";
    import { fade, scale } from "svelte/transition";
    import { clickOutside } from "$lib/utils/clickOutside";

    export let isOpen = false;
    export let onClose: () => void;

    function handleSave() {
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-foreground"
            transition:scale={{ duration: 200, start: 0.95 }}
            use:clickOutside={onClose}
        >
            <div
                class="flex justify-between items-center p-5 border-b border-border bg-muted/50"
            >
                <h2 class="text-lg font-bold flex items-center">Settings</h2>
                <button
                    on:click={onClose}
                    class="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-background rounded"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-6">
                <!-- Theme Selection -->
                <div class="space-y-3">
                    <label class="text-sm font-semibold flex items-center">
                        {#if $settings.theme === "dark"}
                            <Moon class="w-4 h-4 mr-2 text-primary" />
                        {:else}
                            <Sun class="w-4 h-4 mr-2 text-primary" />
                        {/if}
                        Appearance
                    </label>
                    <div
                        class="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border"
                    >
                        <button
                            on:click={() =>
                                settings.update((s) => ({
                                    ...s,
                                    theme: "light",
                                }))}
                            class={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${$settings.theme === "light" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            <Sun size={16} class="mr-2" /> Light
                        </button>
                        <button
                            on:click={() =>
                                settings.update((s) => ({
                                    ...s,
                                    theme: "dark",
                                }))}
                            class={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${$settings.theme === "dark" ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            <Moon size={16} class="mr-2" /> Dark
                        </button>
                    </div>
                </div>

                <!-- Network Selection -->
                <div class="space-y-3">
                    <label class="text-sm font-semibold flex items-center">
                        <Globe class="w-4 h-4 mr-2 text-primary" />
                        Network
                    </label>
                    <div
                        class="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border"
                    >
                        <button
                            on:click={() =>
                                settings.update((s) => ({
                                    ...s,
                                    network: "mainnet",
                                }))}
                            class={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${$settings.network === "mainnet" ? "bg-card text-secondary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            Mainnet
                        </button>
                        <button
                            on:click={() =>
                                settings.update((s) => ({
                                    ...s,
                                    network: "devnet",
                                }))}
                            class={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${$settings.network === "devnet" ? "bg-card text-accent shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            Devnet
                        </button>
                    </div>
                </div>

                <!-- Auto Refresh -->
                <div class="space-y-3">
                    <label class="text-sm font-semibold flex items-center">
                        <RefreshCw class="w-4 h-4 mr-2 text-primary" />
                        Data Refresh
                    </label>

                    <div
                        class="flex items-center justify-between bg-card p-3 rounded-lg border border-border"
                    >
                        <span class="text-sm">Auto-refresh data</span>
                        <button
                            on:click={() =>
                                settings.update((s) => ({
                                    ...s,
                                    autoRefresh: !s.autoRefresh,
                                }))}
                            class={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${$settings.autoRefresh ? "bg-primary" : "bg-border"}`}
                        >
                            <span
                                class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${$settings.autoRefresh ? "translate-x-6" : "translate-x-1"}`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div
                class="p-5 border-t border-border bg-muted/50 flex justify-end"
            >
                <button
                    on:click={handleSave}
                    class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-colors shadow-lg shadow-primary/20 flex items-center"
                >
                    <Save size={16} class="mr-2" />
                    Done
                </button>
            </div>
        </div>
    </div>
{/if}
