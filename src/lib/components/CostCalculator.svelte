<script lang="ts">
    import {
        DollarSign,
        Database,
        Info,
        BarChart3,
        Calculator,
        Minus,
        Plus,
        Cpu,
        Clock,
        Server,
        AlertCircle,
    } from "lucide-svelte";
    import { formatNumber } from "$utils/formatUtils";
    import { fade, slide } from "svelte/transition";

    // --- 1. STORAGE COST ESTIMATOR STATE (Consumer) ---
    let dataSizeTB = 1;
    let storageDuration = 12;
    let accessFrequency: "frequent" | "infrequent" | "archive" = "frequent";
    let egressGB = 100;
    let opsCount = 10000; // per month

    // Provider Rates (Proxied for Dec 2025)
    const rates = {
        aws: { storage: 23, egress: 0.09, ops: 0.005 }, // per 10k ops
        filecoin: { storage: 2.27, egress: 0.01, ops: 0.001 },
        storj: { storage: 4, egress: 0.007, ops: 0.0 },
        arweave: { storage: 11000, egress: 0, ops: 0 }, // one-time fee per TB (approx $11/GB)
        xandeum: { storage: 2.5, egress: 0.005, ops: 0.0005 }, // Proxying competitive rates
    };

    function calculateTotalCost(
        provider: keyof typeof rates,
        isPermanent = false,
    ) {
        const r = rates[provider];
        if (isPermanent && provider === "arweave")
            return r.storage * dataSizeTB;

        const monthlyBase = r.storage * dataSizeTB;
        const monthlyEgress = r.egress * egressGB;
        const monthlyOps = (opsCount / 10000) * r.ops;

        const tierMultiplier =
            accessFrequency === "archive"
                ? 0.2
                : accessFrequency === "infrequent"
                  ? 0.5
                  : 1;
        const totalMonthly =
            monthlyBase * tierMultiplier + monthlyEgress + monthlyOps;

        return totalMonthly * storageDuration;
    }

    $: costComparisonData = [
        { name: "AWS S3", cost: calculateTotalCost("aws") },
        { name: "Filecoin", cost: calculateTotalCost("filecoin") },
        { name: "Storj", cost: calculateTotalCost("storj") },
        { name: "Xandeum", cost: calculateTotalCost("xandeum"), isXand: true },
        {
            name: "Arweave",
            cost: calculateTotalCost("arweave", true),
            isOneTime: true,
        },
    ].sort((a, b) => a.cost - b.cost);

    $: xandeumCost = calculateTotalCost("xandeum");
    $: awsCost = calculateTotalCost("aws");
    $: arweaveCost = calculateTotalCost("arweave", true);

    // --- 2. pNODE ROI CALCULATOR STATE (Provider) ---
    let numNodes = 1;
    let storagePerNodeGB = 1024;
    let perfScore = 0.95;
    let ownStake = 10000;
    let delegatedStake = 100000;
    let commissionRate = 5;
    let nftBoost = 1;
    let eraBoost = 16;
    let annualNetworkRevenue = 15000000;
    let totalNetworkNodes = 500;
    let epochLengthDays = 2.1;
    let xandPrice = 0.045;
    let monthlyOpCost = 10;
    let initialSetupCost = 500;
    let hardwareCost = 1200;

    $: totalNodeStake = ownStake + delegatedStake;
    $: creditsPerEpoch = (() => {
        if (ownStake === 0) return 0;
        return (
            numNodes * storagePerNodeGB * perfScore * (totalNodeStake / 1000)
        );
    })();

    $: totalNetworkCredits = totalNetworkNodes * 1024 * 0.9 * (200000 / 1000);
    $: epochShare = creditsPerEpoch / (totalNetworkCredits + creditsPerEpoch);
    $: annualNetRevenue = annualNetworkRevenue * 0.94;
    $: annualVariableEarningsUSD = annualNetRevenue * epochShare;
    $: annualVariableEarningsXAND = annualVariableEarningsUSD / xandPrice;
    $: boostMultiplier = nftBoost * eraBoost;
    $: boostedVariableEarningsXAND =
        annualVariableEarningsXAND * boostMultiplier;
    $: boostedVariableEarningsUSD = boostedVariableEarningsXAND * xandPrice;

    // Rewards logic
    $: delegatedRewardsXAND =
        boostedVariableEarningsXAND *
        (delegatedStake / Math.max(1, totalNodeStake));
    $: commissionEarningsXAND = delegatedRewardsXAND * (commissionRate / 100);
    $: commissionEarningsUSD = commissionEarningsXAND * xandPrice;
    $: fixedMonthlyXAND = 10000; // Simplified assumption from React
    $: annualFixedXAND = fixedMonthlyXAND * 12;
    $: annualFixedUSD = annualFixedXAND * xandPrice;

    $: totalAnnualEarningsUSD =
        boostedVariableEarningsUSD + commissionEarningsUSD + annualFixedUSD;
    $: totalAnnualEarningsXAND = totalAnnualEarningsUSD / xandPrice;
    $: totalInitialInvestment = initialSetupCost + hardwareCost;
    $: totalAnnualOpCost = monthlyOpCost * 12;
    $: netAnnualProfitUSD = totalAnnualEarningsUSD - totalAnnualOpCost;
    $: annualROI =
        (netAnnualProfitUSD / Math.max(1, totalInitialInvestment)) * 100;
    $: breakEvenMonths =
        totalInitialInvestment /
        Math.max(0.01, totalAnnualEarningsUSD / 12 - monthlyOpCost);

    $: isZero = ownStake === 0 || storagePerNodeGB < 256;
</script>

<div class="space-y-12 animate-in slide-in-from-bottom-4">
    <!-- SECTION 1: STORAGE COST ESTIMATOR (CONSUMER) -->
    <div
        class="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
    >
        <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Database size={120} class="text-primary" />
        </div>

        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10"
        >
            <div>
                <h2
                    class="text-2xl font-black text-foreground tracking-tight flex items-center"
                >
                    <DollarSign class="w-7 h-7 mr-3 text-primary" />
                    Storage Cost Estimator
                </h2>
                <p class="text-sm text-muted-foreground mt-1">
                    Compare Xandeum vs. Cloud & Web3 storage providers.
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    on:click={() => {
                        dataSizeTB = 100;
                        storageDuration = 36;
                        accessFrequency = "archive";
                    }}
                    class="px-3 py-1.5 bg-background rounded-lg border border-border text-[10px] font-bold uppercase hover:text-primary transition-colors"
                    >Archival Preset</button
                >
                <button
                    on:click={() => {
                        dataSizeTB = 5;
                        storageDuration = 12;
                        accessFrequency = "frequent";
                        egressGB = 500;
                    }}
                    class="px-3 py-1.5 bg-background rounded-lg border border-border text-[10px] font-bold uppercase hover:text-primary transition-colors"
                    >App Preset</button
                >
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
            <!-- Controls -->
            <div class="lg:col-span-4 space-y-7">
                <div>
                    <div
                        class="flex justify-between text-xs font-bold uppercase mb-2"
                    >
                        <label class="text-muted-foreground">Data Volume</label>
                        <span class="text-primary font-mono"
                            >{dataSizeTB} TB</span
                        >
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="1000"
                        step="1"
                        bind:value={dataSizeTB}
                        class="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
                <div>
                    <div
                        class="flex justify-between text-xs font-bold uppercase mb-2"
                    >
                        <label class="text-muted-foreground">Duration</label>
                        <span class="text-primary font-mono"
                            >{storageDuration} Months</span
                        >
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        bind:value={storageDuration}
                        class="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Egress (GB/mo)</label
                        >
                        <input
                            type="number"
                            bind:value={egressGB}
                            class="w-full bg-background border border-border rounded-lg p-2 text-sm font-mono font-bold outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Tier</label
                        >
                        <select
                            bind:value={accessFrequency}
                            class="w-full bg-background border border-border rounded-lg p-2 text-xs font-bold outline-none focus:border-primary"
                        >
                            <option value="frequent">Standard / Hot</option>
                            <option value="infrequent">Infrequent / Cool</option
                            >
                            <option value="archive">Archive / Cold</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Chart & Results (Simplified Bar Chart without Recharts) -->
            <div class="lg:col-span-8 flex flex-col gap-6">
                <div
                    class="h-48 bg-background/30 rounded-2xl p-4 border border-border flex flex-col justify-between relative"
                >
                    <!-- Custom Bar Chart -->
                    {#each costComparisonData as entry}
                        {@const maxCost = Math.max(
                            ...costComparisonData.map((c) => c.cost),
                        )}
                        {@const widthPercent = (entry.cost / maxCost) * 100}
                        <div class="flex items-center gap-3">
                            <span
                                class="w-20 text-[10px] text-muted-foreground font-bold text-right truncate"
                                >{entry.name}</span
                            >
                            <div
                                class="flex-1 h-3 bg-border/20 rounded-full overflow-hidden"
                            >
                                <div
                                    class={`h-full rounded-r-full transition-all duration-500 ${entry.isXand ? "bg-primary" : entry.isOneTime ? "bg-accent" : "bg-muted-foreground/30"}`}
                                    style="width: {widthPercent}%"
                                ></div>
                            </div>
                            <span class="w-20 text-[10px] font-mono font-bold"
                                >${formatNumber(entry.cost)}</span
                            >
                        </div>
                    {/each}
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div
                        class="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center"
                    >
                        <div
                            class="text-[10px] font-bold text-primary uppercase mb-1"
                        >
                            Xandeum Total
                        </div>
                        <div
                            class="text-xl font-black text-foreground font-mono"
                        >
                            ${formatNumber(xandeumCost)}
                        </div>
                    </div>
                    <div
                        class="bg-card border border-border rounded-xl p-4 text-center"
                    >
                        <div
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1"
                        >
                            AWS S3 Total
                        </div>
                        <div
                            class="text-xl font-black text-foreground font-mono"
                        >
                            ${formatNumber(awsCost)}
                        </div>
                    </div>
                    <div
                        class="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center"
                    >
                        <div
                            class="text-[10px] font-bold text-accent uppercase mb-1"
                        >
                            One-Time Fee
                        </div>
                        <div
                            class="text-xl font-black text-foreground font-mono"
                        >
                            ${formatNumber(arweaveCost)}
                        </div>
                    </div>
                </div>
                <p class="text-[9px] text-muted-foreground italic text-center">
                    Calculations include storage, egress, and approximate
                    operations fees. Arweave estimates are based on permanent
                    storage.
                </p>
            </div>
        </div>
    </div>

    <div
        class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50"
    ></div>

    <!-- SECTION 2: pNODE ROI CALCULATOR (PROVIDER) -->
    <div
        class="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
    >
        <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Server size={120} class="text-secondary" />
        </div>

        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10"
        >
            <div>
                <h2
                    class="text-2xl font-black text-foreground tracking-tight flex items-center"
                >
                    <Cpu class="w-7 h-7 mr-3 text-secondary" />
                    pNode ROI Simulator
                </h2>
                <p class="text-sm text-muted-foreground mt-1">
                    Estimate earnings and profitability for storage providers.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <div
                    class="px-3 py-1.5 bg-secondary/10 rounded-lg border border-secondary/20 text-[10px] font-black text-secondary flex items-center"
                >
                    <Clock size={12} class="mr-2" />
                    {breakEvenMonths.toFixed(1)} MO PAYBACK
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
            <!-- Controls -->
            <div class="lg:col-span-5 space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Number of pNodes</label
                        >
                        <div
                            class="flex items-center bg-background border border-border rounded-lg p-1"
                        >
                            <button
                                on:click={() =>
                                    (numNodes = Math.max(1, numNodes - 1))}
                                class="p-2 hover:text-secondary transition-colors"
                                ><Minus size={14} /></button
                            >
                            <input
                                type="number"
                                bind:value={numNodes}
                                class="w-full bg-transparent text-center text-sm font-mono font-bold outline-none"
                            />
                            <button
                                on:click={() => (numNodes = numNodes + 1)}
                                class="p-2 hover:text-secondary transition-colors"
                                ><Plus size={14} /></button
                            >
                        </div>
                    </div>
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Capacity (GB)</label
                        >
                        <input
                            type="number"
                            min="256"
                            bind:value={storagePerNodeGB}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-end mb-1">
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase"
                            >Perf Score</label
                        >
                        <span class="text-xs font-mono font-bold text-secondary"
                            >{perfScore.toFixed(2)}</span
                        >
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.01"
                        bind:value={perfScore}
                        class="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Own Staked XAND</label
                        >
                        <input
                            type="number"
                            bind:value={ownStake}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary"
                        />
                    </div>
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Delegated (XAND)</label
                        >
                        <input
                            type="number"
                            bind:value={delegatedStake}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary"
                        />
                    </div>
                </div>

                <!-- Commission & Boosts -->
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Comm. %</label
                        >
                        <input
                            type="number"
                            max="100"
                            bind:value={commissionRate}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >NFT Boost</label
                        >
                        <select
                            bind:value={nftBoost}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-bold outline-none focus:border-primary"
                        >
                            <option value={1}>None (1x)</option>
                            <option value={1.5}>Rabbit (1.5x)</option>
                            <option value={2.5}>Silver (2.5x)</option>
                            <option value={11}>Titan (11x)</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1 block"
                            >Era Boost</label
                        >
                        <select
                            bind:value={eraBoost}
                            class="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-bold outline-none focus:border-primary"
                        >
                            <option value={1}>Genesis (1x)</option>
                            <option value={16}>Deep South (16x)</option>
                        </select>
                    </div>
                </div>

                <!-- Costs & Network -->
                <div
                    class="p-4 bg-background/50 rounded-2xl border border-border border-dashed space-y-4"
                >
                    <div class="flex items-center justify-between">
                        <h4
                            class="text-[10px] font-black text-muted-foreground uppercase tracking-widest"
                        >
                            Pricing & Costs (USD)
                        </h4>
                        <div class="flex items-center gap-2">
                            <span
                                class="text-[9px] font-bold text-muted-foreground"
                                >XAND:</span
                            >
                            <input
                                type="number"
                                step="0.001"
                                bind:value={xandPrice}
                                class="w-16 bg-card border border-border rounded px-1 text-[9px] font-mono font-bold text-right"
                            />
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label
                                class="text-[8px] font-bold text-muted-foreground uppercase mb-1 block"
                                >Mo. Ops ($)</label
                            >
                            <input
                                type="number"
                                bind:value={monthlyOpCost}
                                class="w-full bg-card border border-border rounded-md p-2 text-xs font-mono font-bold outline-none"
                            />
                        </div>
                        <div>
                            <label
                                class="text-[8px] font-bold text-muted-foreground uppercase mb-1 block"
                                >Setup ($)</label
                            >
                            <input
                                type="number"
                                bind:value={initialSetupCost}
                                class="w-full bg-card border border-border rounded-md p-2 text-xs font-mono font-bold outline-none"
                            />
                        </div>
                        <div>
                            <label
                                class="text-[8px] font-bold text-muted-foreground uppercase mb-1 block"
                                >Hardw ($)</label
                            >
                            <input
                                type="number"
                                bind:value={hardwareCost}
                                class="w-full bg-card border border-border rounded-md p-2 text-xs font-mono font-bold outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Outputs -->
            <div class="lg:col-span-7 space-y-6">
                {#if isZero}
                    <div
                        class="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center gap-4 text-accent font-bold text-xs"
                    >
                        <AlertCircle size={18} /> Stake required to activate earnings.
                    </div>
                {/if}

                <div class="grid grid-cols-2 gap-4">
                    <div
                        class="bg-card/50 border border-border rounded-2xl p-6"
                    >
                        <div
                            class="text-[10px] font-bold text-muted-foreground uppercase mb-1"
                        >
                            Annual Earnings
                        </div>
                        <div class="text-3xl font-black text-foreground">
                            ${formatNumber(totalAnnualEarningsUSD)}
                        </div>
                        <div
                            class="text-[10px] font-mono text-secondary mt-1 tracking-wider"
                        >
                            {formatNumber(totalAnnualEarningsXAND)} XAND
                        </div>
                    </div>
                    <div
                        class="bg-secondary/5 border border-secondary/20 rounded-2xl p-6"
                    >
                        <div
                            class="text-[10px] font-bold text-secondary uppercase mb-1"
                        >
                            Annual ROI
                        </div>
                        <div class="text-3xl font-black text-secondary">
                            {annualROI.toFixed(1)}%
                        </div>
                        <div
                            class="text-[10px] font-mono text-muted-foreground mt-1 uppercase"
                        >
                            Net Profitability
                        </div>
                    </div>
                </div>

                <!-- Simple Yield Ramp Projection (using simple colored area-like effect since no Recharts) -->
                <div
                    class="bg-background/50 rounded-2xl p-6 border border-border"
                >
                    <h3
                        class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center"
                    >
                        <BarChart3 class="w-3.5 h-3.5 mr-2" /> Yield Ramp Projection
                    </h3>
                    <div class="h-40 flex items-end justify-between gap-1">
                        {#each Array.from({ length: 13 }) as _, i}
                            {@const earnings = Math.round(
                                (totalAnnualEarningsUSD / 12) * i,
                            )}
                            {@const maxProjected = Math.round(
                                (totalAnnualEarningsUSD / 12) * 12,
                            )}
                            {@const heightPercent =
                                maxProjected > 0
                                    ? (earnings / maxProjected) * 100
                                    : 0}
                            <div
                                class="flex-1 bg-secondary/20 hover:bg-secondary/40 transition-colors rounded-t-sm relative group"
                                style="height: {heightPercent}%"
                            >
                                <div
                                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] bg-background border border-border p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                                >
                                    M{i}: ${earnings}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="flex justify-between mt-4">
                        <div
                            class="flex items-center text-[10px] text-muted-foreground"
                        >
                            <Info size={12} class="mr-1.5" />
                            Investment: ${formatNumber(totalInitialInvestment)}
                        </div>
                        <div
                            class="flex items-center text-[10px] text-muted-foreground"
                        >
                            Commission: {commissionRate}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
