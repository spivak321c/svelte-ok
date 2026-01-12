<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import {
        ArrowDown,
        Info,
        Loader2,
        Wallet,
        RefreshCcw,
        ExternalLink,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    // Mock Wallet Store (Local state for now)
    let publicKey: string | null = null;
    let connected = false;

    // Constants
    const XAND_MINT = "G5siZ5...placeholder";
    const SOL_MINT = "So11111111111111111111111111111111111111112";
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    // State
    let inputToken: "SOL" | "USDC" = "SOL";
    let amount = "1.0";
    let quote: any = null;
    let loadingQuote = false;
    let swapping = false;
    let error: string | null = null;
    let txSignature: string | null = null;
    let debounceTimer: any;

    function connectWallet() {
        // Mock connection
        connected = true;
        publicKey = "8xPDF...MOCKKEY";
    }

    async function fetchQuote() {
        if (!amount || parseFloat(amount) <= 0) {
            quote = null;
            return;
        }

        loadingQuote = true;
        error = null;
        txSignature = null;

        // Mock API Call
        return new Promise((resolve) => {
            setTimeout(() => {
                const rate = inputToken === "SOL" ? 25 : 0.4;
                const mockOut = (parseFloat(amount || "0") * rate).toFixed(2);

                quote = {
                    outAmount: (parseFloat(mockOut) * 1000000).toString(),
                    priceImpactPct: "0.15",
                    inputMint: inputToken,
                    outputMint: XAND_MINT,
                    inAmount: amount,
                    marketInfos: [],
                    swapMode: "ExactIn",
                    slippageBps: 50,
                };
                loadingQuote = false;
                resolve(quote);
            }, 600);
        });
    }

    // Debounce Quote Fetch
    $: {
        if (amount && parseFloat(amount) > 0) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchQuote();
            }, 500);
        } else {
            quote = null;
        }
    }

    async function handleSwap() {
        if (!publicKey || !quote) return;
        swapping = true;
        error = null;

        // Mock Swap
        setTimeout(() => {
            txSignature = "2s3...SimulatedSuccessSignature...x9z";
            swapping = false;
        }, 1500);
    }

    function formatOutAmount(amtStr?: string) {
        if (!amtStr) return "0.00";
        return (parseInt(amtStr) / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
</script>

<div
    class="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 group"
>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-xl font-black text-foreground">Swap Tokens</h2>
            <p class="text-xs text-muted-foreground">
                Best route via Jupiter Aggregator
            </p>
        </div>
        <button
            on:click={fetchQuote}
            class={`p-2 rounded-full cursor-pointer hover:bg-muted/10 transition-colors ${loadingQuote ? "animate-spin" : ""}`}
        >
            <RefreshCcw
                size={16}
                class="text-muted-foreground transition-transform group-hover:rotate-180 duration-700"
            />
        </button>
    </div>

    <!-- Input Section -->
    <div class="space-y-4 relative">
        <!-- FROM -->
        <div
            class="bg-muted/10 rounded-2xl p-4 border border-border hover:border-primary/50 transition-colors shadow-sm"
        >
            <div class="flex justify-between items-center mb-2">
                <label
                    class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >Paying</label
                >
                <span
                    class="text-xs text-muted-foreground flex items-center bg-background px-2 py-0.5 rounded-md border border-border"
                >
                    <Wallet size={10} class="mr-1" />
                    <span class="opacity-70">Balance:</span>
                    <span class="ml-1 font-mono">--</span>
                </span>
            </div>
            <div class="flex gap-4 items-center">
                <div class="relative">
                    <select
                        bind:value={inputToken}
                        class="appearance-none bg-background text-foreground font-bold rounded-xl pl-3 pr-8 py-2 border border-border outline-none focus:border-primary cursor-pointer hover:bg-background/80 transition-colors shadow-sm min-w-[100px]"
                    >
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                    </select>
                    <ArrowDown
                        size={12}
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                </div>
                <input
                    type="number"
                    bind:value={amount}
                    class="bg-transparent text-right text-3xl font-mono font-bold text-foreground outline-none w-full placeholder-muted-foreground/30"
                    placeholder="0.00"
                />
            </div>
        </div>

        <!-- Arrow Divider -->
        <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
            <div
                class="bg-card border border-border p-2 rounded-full shadow-lg text-primary transform group-hover:scale-110 transition-transform duration-300 relative z-20"
            >
                <ArrowDown size={16} strokeWidth={3} />
            </div>
        </div>

        <!-- TO -->
        <div
            class="bg-muted/10 rounded-2xl p-4 border border-border hover:border-secondary/50 transition-colors shadow-sm"
        >
            <div class="flex justify-between items-center mb-2">
                <label
                    class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >Buying</label
                >
            </div>
            <div class="flex gap-4 items-center">
                <div
                    class="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border shadow-sm min-w-[100px]"
                >
                    <div
                        class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                    >
                        X
                    </div>
                    <span class="font-bold text-foreground">XAND</span>
                </div>
                <div class="text-right w-full">
                    {#if loadingQuote}
                        <div
                            class="animate-pulse h-9 w-24 bg-muted-foreground/10 ml-auto rounded"
                        ></div>
                    {:else}
                        <div
                            class="text-3xl font-mono font-bold text-primary drop-shadow-sm"
                        >
                            {quote ? formatOutAmount(quote.outAmount) : "0.00"}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Info Metrics -->
    {#if quote}
        <div
            class="mt-4 px-2 space-y-2 bg-background/50 p-3 rounded-xl border border-border/50"
            in:slide
        >
            <div class="flex justify-between text-xs">
                <span class="text-muted-foreground font-medium">Rate</span>
                <span class="font-mono text-foreground font-bold">
                    1 {inputToken} ≈ {formatOutAmount(quote.outAmount)} XAND
                </span>
            </div>
            <div class="flex justify-between text-xs">
                <span
                    class="text-muted-foreground font-medium flex items-center"
                >
                    Price Impact <Info size={10} class="ml-1 opacity-50" />
                </span>
                <span
                    class={parseFloat(quote.priceImpactPct) > 1
                        ? "text-red-500 font-bold"
                        : "text-green-600 font-bold"}
                >
                    {parseFloat(quote.priceImpactPct).toFixed(2)}%
                </span>
            </div>
        </div>
    {/if}

    <!-- Mock Mode Banner -->
    <div
        class="mt-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono text-center flex items-center justify-center gap-2"
    >
        <Info size={12} />
        Using Simulated Quote (Devnet Mode)
    </div>

    <!-- Action Button -->
    <button
        on:click={!publicKey ? connectWallet : handleSwap}
        disabled={swapping || loadingQuote || (!quote && !!publicKey)}
        class={`
             mt-6 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform
             ${
                 !publicKey
                     ? "bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/25 active:scale-95"
                     : !quote || loadingQuote
                       ? "bg-muted/10 border border-border text-muted-foreground cursor-not-allowed"
                       : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:scale-95"
             }
         `}
    >
        {#if !publicKey}
            <Wallet size={20} /> Connect Wallet
        {:else if swapping}
            <Loader2 size={24} class="animate-spin" /> Confirming...
        {:else}
            Place Order
        {/if}
    </button>

    <!-- Success Overlay -->
    {#if txSignature}
        <div
            class="absolute inset-0 bg-background/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center"
            in:fade
        >
            <div
                class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30"
            >
                <Wallet class="text-white w-10 h-10" />
            </div>
            <h3 class="text-2xl font-black text-foreground mb-2">Swap Sent!</h3>
            <p
                class="text-muted-foreground text-sm mb-6 max-w-[200px] leading-relaxed"
            >
                Your transaction has been submitted to the Solana network.
            </p>
            <a
                href={`https://solana.fm/tx/${txSignature}`}
                target="_blank"
                rel="noreferrer"
                class="px-6 py-2 bg-card hover:bg-muted/20 rounded-full text-foreground font-bold text-sm transition-colors border border-border shadow-sm flex items-center gap-2 group"
            >
                View Explorer <ExternalLink
                    size={12}
                    class="group-hover:translate-x-0.5 transition-transform"
                />
            </a>
            <button
                on:click={() => (txSignature = null)}
                class="mt-8 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-bold"
            >
                Close
            </button>
        </div>
    {/if}
</div>
