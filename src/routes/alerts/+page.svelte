<script lang="ts">
    import { onMount } from "svelte";
    import { alertsStore } from "$stores/alerts";
    import {
        Bell,
        Shield,
        Plus,
        Trash2,
        Save,
        Share2,
        Check,
        AlertTriangle,
        Zap,
        Search,
        Eye,
        Webhook,
        Globe,
        Loader2,
        RefreshCw,
        Send,
        Copy,
    } from "lucide-svelte";
    import { copyToClipboard } from "$utils/clipboardUtils";
    import type { Alert, CreateAlertRequest } from "$types";

    // Subscribe to store
    // Reactive variables from store
    $: ({ alerts, history, loading, error } = $alertsStore);

    let selectedAlert: Alert | null = null;
    let isCreating = false;
    let isImporting = false;
    let importString = "";
    let saving = false;
    let showHistory = false;
    let snippetCopied = false;

    // Form State
    let name = "New Sentinel Rule";
    // 'status' | 'storage' | 'latency'
    let conditionType = "status";
    let conditionValue = "offline";
    // 'global' | 'specific'
    let targetType = "global";
    let targetNodeId = "";
    // 'discord' | 'webhook' | 'email' | 'telegram'
    let channel = "discord";
    let webhookUrl = "";

    onMount(() => {
        alertsStore.fetchAlerts();
    });

    function handleCreateNew() {
        isCreating = true;
        selectedAlert = null;
        name = "New Sentinel Rule";
        conditionType = "status";
        conditionValue = "offline";
        targetType = "global";
        targetNodeId = "";
        channel = "discord";
        webhookUrl = "";
    }

    function handleEdit(alert: Alert) {
        selectedAlert = alert;
        isCreating = true;
        name = alert.name;

        // Map types
        const ruleType = alert.rule_type as string;
        if (ruleType === "node_status") conditionType = "status";
        else if (ruleType === "storage_threshold") conditionType = "storage";
        else if (ruleType === "latency_spike") conditionType = "latency";

        // Value mapping (simplified)
        // Note: alert.conditions.value might be string or number, handled loosely here
        conditionValue = String(alert.conditions?.value || "");
        if (conditionType === "status" && !conditionValue)
            conditionValue = "offline";

        targetType = (alert.conditions?.target_type as string) || "global";
        targetNodeId = (alert.conditions?.node_id as string) || "";

        if (alert.actions && alert.actions.length > 0) {
            channel = alert.actions[0].type as any;
            if (alert.actions[0].config) {
                webhookUrl = alert.actions[0].config.url || "";
            }
        }
    }

    async function handleSave() {
        saving = true;
        try {
            let ruleType = "node_status";
            if (conditionType === "storage") ruleType = "storage_threshold";
            if (conditionType === "latency") ruleType = "latency_spike";

            const conditions: any = {
                operator: conditionType === "status" ? "eq" : "gt",
                value: conditionValue,
                target_type: targetType,
            };
            if (targetType === "specific" && targetNodeId) {
                conditions.node_id = targetNodeId;
            }

            const newAlert: CreateAlertRequest = {
                name,
                description: `Alert for ${conditionType} ${conditionValue}`,
                enabled: true,
                rule_type: ruleType as any, 
                conditions,
                actions: [
                    {
                        type: channel as any,
                        config: {
                            url: webhookUrl,
                            target: webhookUrl,
                        },
                    },
                ],
                cooldown_minutes: 15,
            };

            if (selectedAlert) {
                await alertsStore.updateAlert(selectedAlert.id, newAlert);
            } else {
                await alertsStore.createAlert(newAlert);
            }
            isCreating = false;
            selectedAlert = null;
        } catch (e) {
            alert("Failed to save");
        } finally {
            saving = false;
        }
    }

    async function toggleActive(alert: Alert) {
        await alertsStore.updateAlert(alert.id, { enabled: !alert.enabled });
    }

    async function handleDelete(id: string) {
        if (confirm("Delete alert?")) {
            await alertsStore.deleteAlert(id);
        }
    }

    async function handleImport() {
        try {
            const rule = JSON.parse(importString);
            if (rule.name) {
                await alertsStore.createAlert(rule);
                isImporting = false;
                importString = "";
            }
        } catch {
            alert("Invalid JSON");
        }
    }
</script>

<div
    class="h-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="p-6 md:p-8 border-b border-border bg-card/50 backdrop-blur-sm flex justify-between items-center z-10"
    >
        <div>
            <h1
                class="text-2xl font-bold text-foreground flex items-center tracking-tight"
            >
                <Shield class="w-6 h-6 mr-3 text-primary" /> Sentinel Watchtower
            </h1>
            <p class="text-muted-foreground mt-1 text-sm">
                Configure automated monitoring rules.
            </p>
        </div>
        <div class="flex gap-3">
            <button
                on:click={() => {
                    showHistory = !showHistory;
                    if (showHistory) alertsStore.fetchHistory();
                }}
                class={`px-4 py-2 hover:bg-secondary text-foreground border border-border rounded-lg text-sm font-medium transition-colors flex items-center ${showHistory ? "bg-card border-primary text-primary" : "bg-card"}`}
            >
                <Bell size={16} class="mr-2" /> History
            </button>
            <button
                on:click={() => (isImporting = !isImporting)}
                class="px-4 py-2 bg-card hover:bg-secondary text-foreground border border-border rounded-lg text-sm font-medium transition-colors flex items-center"
            >
                <Share2 size={16} class="mr-2" /> Import
            </button>
            <button
                on:click={handleCreateNew}
                class="px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-lg flex items-center"
            >
                <Plus size={16} class="mr-2" /> New Sentinel
            </button>
        </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel -->
        <div
            class="w-full lg:w-1/3 border-r border-border bg-secondary/30 overflow-y-auto p-6 space-y-4"
        >
            {#if error}
                <div
                    class="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-2 mb-4"
                >
                    <AlertTriangle size={18} />
                    <span class="text-sm font-medium">{error}</span>
                    <button
                        on:click={() => alertsStore.fetchAlerts()}
                        class="ml-auto p-1 hover:bg-destructive/10 rounded"
                        ><RefreshCw size={14} /></button
                    >
                </div>
            {/if}

            {#if showHistory}
                <!-- History View Placeholder -->
                <div class="text-center py-8 text-muted-foreground text-sm">
                    Alert history not fully implemented in mock.
                </div>
            {:else}
                {#if isImporting}
                    <div
                        class="bg-card border border-border p-4 rounded-xl mb-4"
                    >
                        <label
                            class="text-xs font-bold text-muted-foreground uppercase mb-2 block"
                            >Paste JSON</label
                        >
                        <textarea
                            bind:value={importString}
                            class="w-full h-24 bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground mb-3 focus:border-primary outline-none"
                        />
                        <div class="flex justify-end gap-2">
                            <button
                                on:click={() => (isImporting = false)}
                                class="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                                >Cancel</button
                            >
                            <button
                                on:click={handleImport}
                                class="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded"
                                >Import</button
                            >
                        </div>
                    </div>
                {/if}

                {#if loading && alerts.length === 0}
                    <div class="flex justify-center py-10">
                        <Loader2
                            class="w-8 h-8 animate-spin text-primary opacity-50"
                        />
                    </div>
                {:else if alerts.length === 0}
                    <div class="text-center py-10 text-muted-foreground">
                        <Shield class="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No sentinels active.</p>
                    </div>
                {:else}
                    {#each alerts as alert (alert.id)}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            on:click={() => handleEdit(alert)}
                            role="button"
                            tabindex="0"
                            class={`bg-card border ${selectedAlert?.id === alert.id ? "border-primary shadow-md" : "border-border"} rounded-xl p-5 hover:border-primary/50 transition-all shadow-sm group relative cursor-pointer`}
                        >
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-center">
                                    <div
                                        class={`w-2 h-2 rounded-full mr-2 ${alert.enabled ? "bg-secondary animate-pulse" : "bg-muted-foreground"}`}
                                    ></div>
                                    <h3 class="font-bold text-foreground">
                                        {alert.name}
                                    </h3>
                                </div>
                                <div
                                    class="flex items-center gap-2"
                                    on:click|stopPropagation
                                >
                                    <input
                                        type="checkbox"
                                        checked={alert.enabled}
                                        on:change={() => toggleActive(alert)}
                                        class="accent-primary w-4 h-4"
                                    />
                                </div>
                            </div>
                            <div
                                class="space-y-2 text-xs text-muted-foreground"
                            >
                                <div class="flex items-center">
                                    <AlertTriangle
                                        size={12}
                                        class="mr-2 opacity-70"
                                    />
                                    Condition:
                                    <span class="text-accent font-bold mx-1"
                                        >{alert.rule_type}</span
                                    >
                                </div>
                            </div>
                            <!-- Actions -->
                            <div
                                on:click|stopPropagation
                                class="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card p-1 rounded-lg border border-border shadow-lg"
                            >
                                <button
                                    on:click={() => handleDelete(alert.id)}
                                    class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            {/if}
        </div>

        <!-- Right Panel: Builder -->
        <div class="w-full lg:w-2/3 bg-background p-6 lg:p-10 overflow-y-auto">
            {#if isCreating}
                <div class="max-w-2xl mx-auto space-y-8">
                    <!-- Identity -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 mb-2">
                            <div
                                class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm"
                            >
                                1
                            </div>
                            <h2 class="text-lg font-bold text-foreground">
                                Identity
                            </h2>
                        </div>
                        <div class="pl-12">
                            <label
                                class="text-xs font-bold text-muted-foreground uppercase mb-2 block"
                                >Name</label
                            >
                            <input
                                type="text"
                                bind:value={name}
                                class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                placeholder="Rule Name"
                            />
                        </div>
                    </div>

                    <!-- Trigger -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 mb-2">
                            <div
                                class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm"
                            >
                                2
                            </div>
                            <h2 class="text-lg font-bold text-foreground">
                                Trigger
                            </h2>
                        </div>
                        <div class="pl-12 grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    class="text-xs font-bold text-muted-foreground uppercase mb-2 block"
                                    >Metric</label
                                >
                                <select
                                    bind:value={conditionType}
                                    class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                >
                                    <option value="status">Status</option>
                                    <option value="storage">Storage</option>
                                    <option value="latency">Latency</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    class="text-xs font-bold text-muted-foreground uppercase mb-2 block"
                                    >Value</label
                                >
                                {#if conditionType === "status"}
                                    <select
                                        bind:value={conditionValue}
                                        class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    >
                                        <option value="offline">Offline</option>
                                        <option value="delinquent"
                                            >Delinquent</option
                                        >
                                        <option value="active">Active</option>
                                    </select>
                                {:else}
                                    <input
                                        type="number"
                                        bind:value={conditionValue}
                                        class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    />
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Scope -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 mb-2">
                            <div
                                class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm"
                            >
                                3
                            </div>
                            <h2 class="text-lg font-bold text-foreground">
                                Scope
                            </h2>
                        </div>
                        <div class="pl-12 space-y-3">
                            <div class="flex gap-4">
                                <button
                                    on:click={() => (targetType = "global")}
                                    class={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${targetType === "global" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
                                    >Global</button
                                >
                                <button
                                    on:click={() => (targetType = "specific")}
                                    class={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${targetType === "specific" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
                                    >Specific</button
                                >
                            </div>
                            {#if targetType === "specific"}
                                <input
                                    type="text"
                                    bind:value={targetNodeId}
                                    placeholder="Node ID / PubKey"
                                    class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                />
                            {/if}
                        </div>
                    </div>

                    <!-- Action -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 mb-2">
                            <div
                                class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm"
                            >
                                4
                            </div>
                            <h2 class="text-lg font-bold text-foreground">
                                Action
                            </h2>
                        </div>
                        <div class="pl-12 space-y-4">
                            <div class="flex gap-4">
                                <button
                                    on:click={() => (channel = "discord")}
                                    class={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 ${channel === "discord" ? "bg-[#5865F2]/10 border-[#5865F2] text-[#5865F2]" : "bg-card border-border text-muted-foreground"}`}
                                >
                                    <span class="font-bold text-sm"
                                        >Discord</span
                                    >
                                </button>
                                <button
                                    on:click={() => (channel = "webhook")}
                                    class={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 ${channel === "webhook" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
                                >
                                    <span class="font-bold text-sm"
                                        >Webhook</span
                                    >
                                </button>
                            </div>
                            {#if channel === "webhook"}
                                <input
                                    type="text"
                                    bind:value={webhookUrl}
                                    placeholder="URL"
                                    class="w-full bg-card border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                />
                            {/if}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="pt-6 border-t border-border flex justify-end gap-4"
                    >
                        <button
                            on:click={() => (isCreating = false)}
                            class="px-6 py-3 bg-transparent hover:bg-card text-muted-foreground rounded-xl font-bold transition-colors"
                            >Cancel</button
                        >
                        <button
                            on:click={handleSave}
                            disabled={saving}
                            class="px-8 py-3 rounded-xl font-bold text-primary-foreground bg-primary hover:brightness-110 shadow-lg disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Sentinel"}
                        </button>
                    </div>
                </div>
            {:else}
                <div
                    class="h-full flex flex-col items-center justify-center text-center opacity-40"
                >
                    <div
                        class="bg-card p-6 rounded-full border border-border mb-6"
                    >
                        <Eye size={48} class="text-muted-foreground" />
                    </div>
                    <h2 class="text-xl font-bold text-foreground mb-2">
                        Select or Create a Sentinel
                    </h2>
                </div>
            {/if}
        </div>
    </div>
</div>
