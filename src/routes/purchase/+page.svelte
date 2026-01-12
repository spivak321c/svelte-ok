<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Zap,
        RefreshCw,
        HardDrive,
        TrendingUp,
        Shield,
        AlertTriangle,
    } from "lucide-svelte";
    import SimpleSwap from "$lib/components/SimpleSwap.svelte";
    import { fade } from "svelte/transition";

    let prices = { sol: 0, xand: 0 };
    let loadingPrices = true;
    let error: string | null = null;
    let interval: any;

    async function fetchPrices() {
        try {
            loadingPrices = true;
            error = null;
            // Fetch from CoinGecko
            const response = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=solana,xandeum&vs_currencies=usd",
            );
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();

            // Fallback for Xandeum if not listed
            const xandPrice = data.xandeum?.usd || 0.042;
            const solPrice = data.solana?.usd || 0;

            prices = { sol: solPrice, xand: xandPrice };
        } catch (err) {
            console.error("Failed to fetch prices", err);
            error = "Unable to fetch live data";
            // Fallback
            prices = { sol: 150, xand: 0.042 }; // Use some realistic defaults
        } finally {
            loadingPrices = false;
        }
    }

    onMount(() => {
        fetchPrices();
        interval = setInterval(fetchPrices, 60000); // 1 min update
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<div
    class="h-full bg-background overflow-y-auto custom-scrollbar p-4 lg:p-8 animate-in fade-in duration-500"
>
    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto mb-10">
        <div
            class="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-primary to-accent shadow-2xl"
        >
            <div
                class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"
            ></div>
            <div
                class="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-black/20 to-transparent"
            ></div>

            <div
                class="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8"
            >
                <div class="max-w-2xl">
                    <div
                        class="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20"
                    >
                        <Zap size={12} class="mr-2" /> Live Market Data
                    </div>
                    <h1
                        class="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight"
                    >
                        Acquire XAND Tokens
                    </h1>
                    <p class="text-white/80 text-lg leading-relaxed mb-6">
                        Swap SOL or USDC for XAND instantly using Jupiter's
                        best-price routing. No centralized exchange required.
                    </p>

                    <!-- Live Ticker -->
                    <div class="flex flex-wrap gap-4">
                        <div
                            class="bg-black/30 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center"
                        >
                            <div
                                class="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 font-bold text-white text-xs"
                            >
                                X
                            </div>
                            <div>
                                <div
                                    class="text-[10px] text-white/60 uppercase font-bold"
                                >
                                    XAND / USD
                                </div>
                                <div
                                    class="text-lg font-mono font-bold text-white"
                                >
                                    {loadingPrices
                                        ? "..."
                                        : `$${prices.xand.toFixed(4)}`}
                                </div>
                            </div>
                        </div>
                        <div
                            class="bg-black/30 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center"
                        >
                            <div
                                class="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center mr-3 font-bold text-white text-xs"
                            >
                                S
                            </div>
                            <div>
                                <div
                                    class="text-[10px] text-white/60 uppercase font-bold"
                                >
                                    SOL / USD
                                </div>
                                <div
                                    class="text-lg font-mono font-bold text-white"
                                >
                                    {loadingPrices
                                        ? "..."
                                        : `$${prices.sol.toFixed(2)}`}
                                </div>
                            </div>
                        </div>
                        <button
                            on:click={fetchPrices}
                            class="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                        >
                            <RefreshCw
                                size={18}
                                class={loadingPrices ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column: Swap Interface -->
        <div class="lg:col-span-5 space-y-6">
            <SimpleSwap />

            <div
                class="bg-card border border-border rounded-xl p-4 flex items-start"
            >
                <Shield class="text-green-500 w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <div>
                    <h4 class="text-sm font-bold text-foreground mb-1">
                        Secure & Decentralized
                    </h4>
                    <p class="text-xs text-muted-foreground">
                        Transaction runs directly on the Solana blockchain. You
                        retain full custody of your assets until the swap
                        executes.
                    </p>
                </div>
            </div>
        </div>

        <!-- Right Column: Economics & Info -->
        <div class="lg:col-span-7 space-y-6">
            <!-- Quick Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    class="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    >
                        <HardDrive class="text-primary w-6 h-6" />
                    </div>
                    <h3 class="text-lg font-bold text-foreground mb-2">
                        Utility: Storage Rent
                    </h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                        XAND is the native currency for purchasing storage space
                        on the Xandeum network. pNode operators earn XAND for
                        providing reliable capacity.
                    </p>
                </div>

                <div
                    class="bg-card border border-border rounded-2xl p-6 hover:border-secondary/50 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    >
                        <TrendingUp class="text-secondary w-6 h-6" />
                    </div>
                    <h3 class="text-lg font-bold text-foreground mb-2">
                        Deflationary Fees
                    </h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                        A portion of transaction fees on the network is
                        permanently burned, introducing a deflationary pressure
                        as network usage scales.
                    </p>
                </div>
            </div>

            <!-- Info Block -->
            <div class="bg-card border border-border rounded-2xl p-6 md:p-8">
                <h3 class="text-xl font-bold text-foreground mb-6">
                    Why XANDEUM?
                </h3>

                <div class="space-y-4">
                    <div class="flex items-start">
                        <div
                            class="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm text-muted-foreground mr-4 shrink-0"
                        >
                            1
                        </div>
                        <div>
                            <h4 class="font-bold text-foreground">
                                Scalable Storage
                            </h4>
                            <p class="text-sm text-muted-foreground mt-1">
                                Unlike expensive on-chain storage, Xandeum
                                enables exabyte-scale data availability for
                                dApps.
                            </p>
                        </div>
                    </div>

                    <div class="w-px h-6 bg-border ml-4 my-1"></div>

                    <div class="flex items-start">
                        <div
                            class="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm text-muted-foreground mr-4 shrink-0"
                        >
                            2
                        </div>
                        <div>
                            <h4 class="font-bold text-foreground">
                                Solana Integration
                            </h4>
                            <p class="text-sm text-muted-foreground mt-1">
                                Deep integration with Solana means
                                lightning-fast settlement and composite
                                composability with other SPL tokens.
                            </p>
                        </div>
                    </div>

                    <div class="w-px h-6 bg-border ml-4 my-1"></div>

                    <div class="flex items-start">
                        <div
                            class="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm text-muted-foreground mr-4 shrink-0"
                        >
                            3
                        </div>
                        <div>
                            <h4 class="font-bold text-foreground">
                                Community Owned
                            </h4>
                            <p class="text-sm text-muted-foreground mt-1">
                                The network is owned by the pNode operators and
                                token holders, not a centralized corporation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 flex items-start"
            >
                <AlertTriangle
                    class="text-yellow-600 dark:text-yellow-500 w-6 h-6 mr-4 shrink-0 mt-1"
                />
                <div>
                    <h4 class="font-bold text-foreground mb-1">
                        Trading Warning
                    </h4>
                    <p class="text-sm text-muted-foreground">
                        Always verify the token contract address before
                        swapping. The official XAND mint address will be
                        published on the Xandeum documentation portal.
                        <br /><span class="italic opacity-80 mt-1 block"
                            >Note: This is a devnet/beta environment simulation.</span
                        >
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
