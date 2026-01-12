<script lang="ts">
    import { Code, Clock, ChevronRight } from "lucide-svelte";
    import clsx from "clsx";

    export let calls = [
        { method: "get_stats", status: "Success", duration: "284 ms" },
        { method: "get_stats", status: "Success", duration: "537 ms" },
        { method: "get_pods", status: "Success", duration: "352 ms" },
    ];
</script>

<div
    class="bg-[#0f111a] border border-white/5 rounded-2xl flex flex-col h-full shadow-2xl relative overflow-hidden group"
>
    <div
        class="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1f36]/20"
    >
        <h3 class="text-white/70 font-medium text-lg tracking-wide">
            Recent pRPC Calls
        </h3>
        <button class="text-white/40 hover:text-white transition-colors">
            <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor">
                <circle cx="2" cy="2" r="2" />
                <circle cx="10" cy="2" r="2" />
                <circle cx="18" cy="2" r="2" />
            </svg>
        </button>
    </div>

    <div class="p-4 flex-1 overflow-auto custom-scrollbar">
        <ul class="space-y-1">
            {#each calls as call}
                <li
                    class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover/item:scale-110 transition-transform"
                        >
                            <Code size={16} />
                        </div>
                        <div class="flex flex-col">
                            <span
                                class="text-sm font-bold text-white/90 font-mono tracking-tight"
                                >{call.method}</span
                            >
                            <div class="flex items-center gap-2 mt-0.5">
                                <span
                                    class={clsx(
                                        "inline-flex w-1.5 h-1.5 rounded-full",
                                        call.status === "Success"
                                            ? "bg-emerald-500"
                                            : "bg-amber-500",
                                    )}
                                ></span>
                                <span
                                    class="text-[10px] uppercase font-black tracking-widest text-white/30"
                                    >{call.status}</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span
                            class="text-xs font-medium text-white/40 font-mono"
                            >{call.duration}</span
                        >
                    </div>
                </li>
            {/each}
        </ul>
    </div>

    <div class="p-4 border-t border-white/5 bg-[#1a1f36]/10">
        <button
            class="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
            View Logs <ChevronRight size={14} />
        </button>
    </div>
</div>
