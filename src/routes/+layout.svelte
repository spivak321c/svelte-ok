<script lang="ts">
    import "../app.css";
    import { settings } from "$stores/settings";
    import { onMount } from "svelte";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    import NavItem from "$lib/components/layout/NavItem.svelte";
    import MobileNavItem from "$lib/components/layout/MobileNavItem.svelte";
    import {
        LayoutDashboard,
        Globe,
        Terminal,
        Network,
        Settings,
        Menu,
        X,
        List,
        History,
        Coins,
        Bell,
        Calculator,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let showSettings = false;
    let mobileMenuOpen = false;

    // Use a store or prop for this if available, using mock date for now to match UI
    let lastUpdated: Date | null = new Date();

    onMount(() => {
        settings.init();
    });

    function handleNavClick() {
        mobileMenuOpen = false;
    }

    $: timeAgoText = (() => {
        if (!lastUpdated) return "";
        const diff = new Date().getTime() - lastUpdated.getTime();
        return diff < 60000 ? "LIVE" : `${Math.floor(diff / 60000)}M AGO`;
    })();
</script>

<div
    class="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans"
>
    <!-- Top Navbar -->
    <header
        class="h-16 flex-shrink-0 z-30 bg-card/90 backdrop-blur-md border-b border-border shadow-sm relative sticky top-0"
    >
        <div class="h-full px-4 lg:px-6 flex items-center justify-between">
            <!-- Logo Section -->
            <a
                href="/dashboard"
                class="flex items-center gap-3 min-w-max group cursor-pointer no-underline"
            >
                <div
                    class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-card flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-transform group-hover:scale-105"
                >
                    <Network class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span
                        class="font-extrabold text-lg tracking-tight text-foreground block leading-none"
                    >
                        XANDXPLORER
                    </span>
                </div>
            </a>

            <!-- Center Navigation - Desktop -->
            <nav
                class="hidden lg:flex flex-1 items-center justify-start px-8 gap-2 overflow-x-auto custom-scrollbar h-full"
            >
                <NavItem
                    icon={LayoutDashboard}
                    label="Dashboard"
                    href="/dashboard"
                />
                <NavItem icon={List} label="Nodes" href="/nodes" />
                <NavItem icon={Globe} label="Topology" href="/map" />
                <NavItem icon={Bell} label="Alerts" href="/alerts" />
                <NavItem icon={Calculator} label="Calculator" href="/planner" />
                <NavItem icon={History} label="Analytics" href="/analysis" />
                <NavItem icon={Coins} label="$XAND" href="/purchase" />
                <div class="w-px h-5 bg-border mx-2"></div>
                <NavItem
                    icon={Terminal}
                    label="Playground"
                    href="/playground"
                />
            </nav>

            <!-- Right Actions -->
            <div class="flex items-center gap-3 min-w-max">
                <div
                    class="hidden md:flex items-center space-x-4 text-xs font-mono text-muted-foreground bg-secondary/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-inner"
                >
                    {#if lastUpdated}
                        <span
                            class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                        ></span>
                        <span title={lastUpdated.toLocaleString()}>
                            {timeAgoText}
                        </span>
                    {/if}
                </div>

                <button
                    on:click={() => (showSettings = true)}
                    class="p-2 text-muted-foreground hover:text-primary bg-secondary/50 hover:bg-secondary rounded-lg transition-all border border-transparent hover:border-border"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>

                <!-- Mobile Menu Toggle -->
                <button
                    class="lg:hidden p-2 bg-card rounded-lg text-muted-foreground shadow-sm border border-border"
                    on:click={() => (mobileMenuOpen = true)}
                >
                    <Menu size={20} />
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden relative">
        <!-- Mobile Sidebar Overlay -->
        {#if mobileMenuOpen}
            <div class="fixed inset-0 z-50 lg:hidden">
                <div
                    class="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    on:click={() => (mobileMenuOpen = false)}
                    transition:fade={{ duration: 200 }}
                />
                <div
                    class="absolute inset-y-0 left-0 w-72 bg-card shadow-2xl flex flex-col border-r border-border"
                    transition:slide={{ axis: "x", duration: 200 }}
                >
                    <div
                        class="h-16 flex items-center justify-between px-6 border-b border-border"
                    >
                        <div class="flex items-center">
                            <Network class="w-6 h-6 text-primary" />
                            <span class="ml-3 font-bold text-lg text-foreground"
                                >XANDEUM</span
                            >
                        </div>
                        <button
                            on:click={() => (mobileMenuOpen = false)}
                            class="text-muted-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <nav class="p-4 space-y-1 overflow-y-auto">
                        <MobileNavItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            href="/dashboard"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={List}
                            label="pNodes List"
                            href="/nodes"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={Globe}
                            label="Earth View"
                            href="/map"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={Bell}
                            label="Sentinel Alerts"
                            href="/alerts"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={Calculator}
                            label="Storage Planner"
                            href="/planner"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={History}
                            label="Historical Analysis"
                            href="/analysis"
                            onClick={handleNavClick}
                        />
                        <MobileNavItem
                            icon={Coins}
                            label="Get $XAND"
                            href="/purchase"
                            onClick={handleNavClick}
                        />
                        <div class="my-2 border-t border-border"></div>
                        <MobileNavItem
                            icon={Terminal}
                            label="RPC Playground"
                            href="/playground"
                            onClick={handleNavClick}
                        />
                    </nav>
                </div>
            </div>
        {/if}

        <div
            class="w-full h-full overflow-auto custom-scrollbar bg-background relative flex flex-col"
        >
            <slot />
        </div>
    </main>
</div>

<SettingsModal isOpen={showSettings} onClose={() => (showSettings = false)} />
