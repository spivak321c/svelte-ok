<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Layers,
        Activity,
        Play,
        Pause,
        RotateCcw,
        Plus,
        Cpu,
        ShieldCheck,
        ShieldAlert,
        Anchor,
        Info,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    interface SimNode {
        id: number;
        status: "healthy" | "failed" | "repairing";
        shards: number[];
    }

    // 1. INPUT STATE
    let fileSizeMB = 100;
    let totalNodes = 12;
    let redundancyK = 6; // Data Shards
    let redundancyM = 4; // Parity Shards
    let failureRate = 20; // % chance
    let enableTSS = true;
    let enableAnchoring = true;

    // 2. SIMULATION STATE
    let nodes: SimNode[] = [];
    let simStep = 0;
    let isRunning = false;
    let lastEvent = "Simulator ready.";
    let stats = { recovered: 0, totalRuns: 0, anchoredEvents: 0 };
    let interval: any;

    const repairThreshold = 80; // %
    const challengeFreq = 5;

    // Initialize Nodes
    function createInitialNodes(
        total: number,
        k: number,
        m: number,
    ): SimNode[] {
        const initialNodes: SimNode[] = Array.from(
            { length: total },
            (_, i) => ({
                id: i,
                status: "healthy",
                shards: [],
            }),
        );

        const totalShards = k + m;
        for (let s = 0; s < totalShards; s++) {
            const nodeIdx = s % total;
            initialNodes[nodeIdx].shards.push(s);
        }
        return initialNodes;
    }

    // React to param changes
    $: {
        // Reset if params change fundamentally (simple approach)
        if (
            !isRunning &&
            (nodes.length !== totalNodes ||
                (nodes[0] &&
                    nodes.length > 0 &&
                    redundancyK + redundancyM !==
                        nodes.reduce((acc, n) => acc + n.shards.length, 0)))
        ) {
            resetSim();
        }
    }

    function init() {
        nodes = createInitialNodes(totalNodes, redundancyK, redundancyM);
        setLastEvent(
            "System initialized with " +
                (redundancyK + redundancyM) +
                " shards.",
        );
    }

    // Initial setup
    onMount(() => {
        init();
    });

    function setLastEvent(msg: string) {
        lastEvent = msg;
    }

    function resetSim() {
        isRunning = false;
        simStep = 0;
        stats = { recovered: 0, totalRuns: 0, anchoredEvents: 0 };
        nodes = createInitialNodes(totalNodes, redundancyK, redundancyM);
        setLastEvent("Simulator reset.");
    }

    function toggleSim() {
        isRunning = !isRunning;
    }

    // Simulation Loop
    $: if (isRunning) {
        clearInterval(interval);
        interval = setInterval(() => {
            stepSim();
        }, 2000);
    } else {
        clearInterval(interval);
    }

    onDestroy(() => {
        clearInterval(interval);
    });

    function stepSim() {
        simStep += 1;
        let event = "";

        // 1. Random Failures
        nodes = nodes.map((node) => {
            if (
                node.status === "healthy" &&
                Math.random() < (failureRate / 100) * 0.1
            ) {
                event = `Node ${node.id} failed!`;
                return { ...node, status: "failed" };
            }
            return node;
        });

        // 2. Self-Repair Check
        const totalShards = redundancyK + redundancyM;
        const healthyNodes = nodes.filter((n) => n.status === "healthy");
        const activeShardsCount = nodes.reduce((acc, n) => {
            if (n.status === "healthy") return acc + n.shards.length;
            return acc;
        }, 0);

        const healthPercent = (activeShardsCount / totalShards) * 100;

        if (healthPercent < repairThreshold && healthyNodes.length > 0) {
            const failedNodes = nodes.filter((n) => n.status === "failed");
            if (failedNodes.length > 0) {
                // Pick one to repair
                const repairIdx = Math.floor(
                    Math.random() * failedNodes.length,
                );
                const targetId = failedNodes[repairIdx].id;

                // Mark as repairing immediately
                nodes = nodes.map((n) =>
                    n.id === targetId ? { ...n, status: "repairing" } : n,
                );
                event = `Initiating self-repair on Node ${targetId}...`;

                // Finish repair after delay (using setTimeout inside loop is tricky in Svelte/React if state depends on prev, but here we just update store/state)
                setTimeout(() => {
                    nodes = nodes.map((n) =>
                        n.id === targetId ? { ...n, status: "healthy" } : n,
                    );
                    setLastEvent(`Redundancy restored on Node ${targetId}.`);
                }, 1500);
            }
        }

        if (event) setLastEvent(event);

        // Challenges
        if (simStep % challengeFreq === 0) {
            if (enableAnchoring) stats.anchoredEvents++;
            setLastEvent(
                "PoST Challenge issued. Integrity verified via " +
                    (enableTSS ? "TSS" : "Direct Check") +
                    ".",
            );
        }
    }

    // Derived Stats
    $: activeShardsCount = nodes.reduce((acc, n) => {
        if (n.status !== "failed") return acc + n.shards.length;
        return acc;
    }, 0);

    $: isRecoverable = activeShardsCount >= redundancyK;
    $: recoveryProgress =
        (activeShardsCount / (redundancyK + redundancyM)) * 100;
</script>

<div class="space-y-8 animate-in slide-in-from-right-4">
    <div
        class="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
    >
        <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Layers size={140} class="text-accent" />
        </div>

        <!-- Header -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10"
        >
            <div>
                <h2
                    class="text-2xl font-black text-foreground tracking-tight flex items-center"
                >
                    <Activity class="w-7 h-7 mr-3 text-accent" />
                    Redundancy Protocol Simulator
                </h2>
                <p class="text-sm text-muted-foreground mt-1">
                    Erasure Coding: <span
                        class="font-mono text-accent font-bold"
                        >{redundancyK}+{redundancyM}</span
                    >
                    - Tolerate {redundancyM} concurrent failures.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <button
                    on:click={toggleSim}
                    class={`flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-all ${isRunning ? "bg-accent/20 text-accent border border-accent/30" : "bg-primary text-white shadow-lg shadow-primary/20"}`}
                >
                    {#if isRunning}
                        <Pause size={16} class="mr-2" />
                    {:else}
                        <Play size={16} class="mr-2" />
                    {/if}
                    {isRunning ? "PAUSE" : "START SIM"}
                </button>
                <button
                    on:click={resetSim}
                    class="p-2 bg-background rounded-xl border border-border hover:text-primary transition-colors"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
            <!-- Controls Panel -->
            <div class="lg:col-span-4 space-y-6">
                <div
                    class="bg-background/50 rounded-2xl p-6 border border-border space-y-6"
                >
                    <h3
                        class="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center"
                    >
                        <Plus size={12} class="mr-2" /> Parameters
                    </h3>

                    <div>
                        <div
                            class="flex justify-between text-[10px] font-bold uppercase mb-2"
                        >
                            <label class="text-muted-foreground"
                                >File Size</label
                            >
                            <span class="text-accent font-mono"
                                >{fileSizeMB} MB</span
                            >
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="1000"
                            step="10"
                            bind:value={fileSizeMB}
                            class="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="text-[9px] font-bold text-muted-foreground uppercase mb-1 block"
                                >pNodes</label
                            >
                            <input
                                type="number"
                                min="5"
                                max="50"
                                bind:value={totalNodes}
                                on:change={init}
                                class="w-full bg-card border border-border rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label
                                class="text-[9px] font-bold text-muted-foreground uppercase mb-1 block"
                                >Fault Tol. (m)</label
                            >
                            <input
                                type="number"
                                min="1"
                                max="10"
                                bind:value={redundancyM}
                                on:change={init}
                                class="w-full bg-card border border-border rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div>
                        <div
                            class="flex justify-between text-[10px] font-bold uppercase mb-2"
                        >
                            <label class="text-muted-foreground"
                                >Failure Rate</label
                            >
                            <span class="text-red-400 font-mono"
                                >{failureRate}%</span
                            >
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            bind:value={failureRate}
                            class="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-red-400"
                        />
                    </div>

                    <div class="space-y-3 pt-2">
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                bind:checked={enableTSS}
                                class="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                            />
                            <span
                                class="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors"
                                >Enable TSS Integrity Checks</span
                            >
                        </label>
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                bind:checked={enableAnchoring}
                                class="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                            />
                            <span
                                class="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors"
                                >Anchor to Solana Ledger</span
                            >
                        </label>
                    </div>
                </div>

                <!-- Event Logger -->
                <div
                    class="bg-black/20 rounded-2xl p-4 border border-border h-32 overflow-hidden flex flex-col font-mono"
                >
                    <div
                        class="text-[9px] text-muted-foreground flex items-center justify-between mb-2"
                    >
                        <span class="flex items-center"
                            ><Activity size={10} class="mr-1" /> SYSTEM_LOG</span
                        >
                        <span>STEP: {simStep}</span>
                    </div>
                    <div
                        class="flex-1 text-[11px] text-accent/80 leading-relaxed"
                    >
                        {">"}
                        {lastEvent}
                    </div>
                </div>
            </div>

            <!-- Simulation Visualization -->
            <div class="lg:col-span-8 space-y-8">
                <!-- Shard Grid -->
                <div
                    class="relative bg-background/30 rounded-3xl border border-border p-8 overflow-hidden min-h-[350px]"
                >
                    <!-- Shards -->
                    <div
                        class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 relative z-10"
                    >
                        {#each nodes as node (node.id)}
                            <div class="group relative" in:scale>
                                <div
                                    class={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 relative ${
                                        node.status === "failed"
                                            ? "bg-red-500/10 border-red-500/40 text-red-500/50 grayscale"
                                            : node.status === "repairing"
                                              ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-500 animate-pulse"
                                              : "bg-card border-border text-muted-foreground hover:border-accent hover:shadow-lg hover:shadow-accent/5"
                                    }`}
                                >
                                    <Cpu
                                        size={20}
                                        class={node.status === "healthy"
                                            ? "text-muted-foreground/40"
                                            : ""}
                                    />
                                    <span
                                        class="text-[8px] font-black mt-1 uppercase"
                                        >pNode {node.id}</span
                                    >

                                    <!-- Shard Indicators -->
                                    <div
                                        class="flex gap-1 mt-1.5 flex-wrap justify-center px-1"
                                    >
                                        {#each node.shards as s}
                                            <div
                                                class={`w-1.5 h-1.5 rounded-full ${node.status === "healthy" ? "bg-accent shadow-[0_0_8px_var(--color-accent)]" : "bg-current opacity-20"}`}
                                            />
                                        {/each}
                                    </div>

                                    <!-- TSS badge -->
                                    {#if enableTSS && node.status === "healthy" && simStep % challengeFreq === 1}
                                        <div
                                            class="absolute -top-1 -right-1 bg-accent text-background font-black text-[7px] px-1 rounded animate-bounce"
                                        >
                                            TSS
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <!-- Solana Anchor Indicators -->
                    <div
                        class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none"
                    >
                        {#each Array.from( { length: stats.anchoredEvents % 20 }, ) as _, i}
                            <div
                                class="w-1 h-1 bg-secondary rounded-full animate-ping"
                                style={`animation-delay: ${i * 0.1}s`}
                            ></div>
                        {/each}
                    </div>
                </div>

                <!-- Recovery Status Card -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        class={`col-span-2 rounded-2xl border p-6 flex flex-col justify-between transition-colors duration-500 ${isRecoverable ? "bg-accent/5 border-accent/20" : "bg-red-500/5 border-red-500/20"}`}
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                {#if isRecoverable}
                                    <ShieldCheck class="text-accent" />
                                {:else}
                                    <ShieldAlert class="text-red-500" />
                                {/if}
                                <h4
                                    class={`text-sm font-black uppercase tracking-widest ${isRecoverable ? "text-accent" : "text-red-500"}`}
                                >
                                    {isRecoverable
                                        ? "DATA RECOVERABLE"
                                        : "DATA LOSS DETECTED"}
                                </h4>
                            </div>
                            <span
                                class="text-xs font-mono font-bold text-foreground opacity-60"
                                >REDUNDANCY: {activeShardsCount}/{redundancyK +
                                    redundancyM}</span
                            >
                        </div>
                        <div
                            class="w-full h-2 bg-background rounded-full overflow-hidden"
                        >
                            <div
                                class={`h-full transition-all duration-1000 ${isRecoverable ? "bg-accent" : "bg-red-500"}`}
                                style={`width: ${recoveryProgress}%`}
                            />
                        </div>
                        <div
                            class="mt-3 text-[10px] text-muted-foreground flex justify-between"
                        >
                            <span
                                >Tolerated Failures: {redundancyM} concurrent</span
                            >
                            <span>Recovery Threshold: {redundancyK} shards</span
                            >
                        </div>
                    </div>

                    <div
                        class="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                    >
                        <Anchor size={20} class="text-secondary mb-2" />
                        <div
                            class="text-2xl font-black text-foreground font-mono"
                        >
                            {stats.anchoredEvents}
                        </div>
                        <div
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                        >
                            Anchored Events
                        </div>
                    </div>
                </div>

                <div class="bg-card border border-border rounded-2xl p-6">
                    <h4
                        class="text-sm font-bold text-foreground mb-3 flex items-center"
                    >
                        <Info size={16} class="mr-2 text-accent" />
                        Protocol Insight
                    </h4>
                    <p class="text-xs text-muted-foreground leading-relaxed">
                        Xandeum utilizes <strong>k+m Erasure Coding</strong>
                        where data is split into {redundancyK} data shards and {redundancyM}
                        parity shards. Any combination of {redundancyK} shards can
                        reconstruct the original file. This provides high availability
                        with only {(
                            (redundancyK + redundancyM) /
                            redundancyK
                        ).toFixed(1)}x storage overhead, significantly more
                        efficient than traditional 3x replication.
                        {enableTSS
                            ? " Threshold Signature Scheme (TSS) ensures that storage challenges are validated by a quorum of nodes without exposing sensitive keys."
                            : ""}
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
