<script lang="ts">
    import { Wifi, Server, HardDrive, ChevronRight } from "lucide-svelte";
    import { scaleLinear } from "d3-scale";
    import { line, curveMonotoneX } from "d3-shape";

    // Mock sparkline data
    const generateSparkline = (points = 20) => 
        Array.from({ length: points }, (_, i) => ({ x: i, y: Math.random() * 10 }));

    export let receivedStats = { value: "11.2 M", data: generateSparkline() };
    export let sentStats = { value: "2.8 M", data: generateSparkline() };
    export let storageStats = { total: "438.2 GB", pages: "10.1M", lastUpdated: "Apr 23 2024 10.30 AM", data: generateSparkline(40) };

    function getSparklinePath(data: any[], width: number, height: number) {
        const xScale = scaleLinear().domain([0, data.length - 1]).range([0, width]);
        const yScale = scaleLinear().domain([0, 10]).range([height, 0]);
        return line<any>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(curveMonotoneX)(data);
    }
</script>

<div class="flex flex-col gap-6 h-full">
    <!-- Packets Stats -->
    <div class="bg-[#0f111a] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
         <div class="flex justify-between items-center mb-6">
            <h3 class="text-white/70 font-medium text-lg tracking-wide">System Stats</h3>
            <button class="text-white/40 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                View Logs <ChevronRight size={14} />
            </button>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- Received -->
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-white/50">
                        <Wifi size={14} class="text-emerald-500" />
                        <span class="text-xs font-bold uppercase tracking-wider">Packets Received</span>
                    </div>
                    <span class="text-lg font-black text-white">{receivedStats.value}</span>
                </div>
                <div class="h-12 w-full">
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                        <path 
                            d={getSparklinePath(receivedStats.data, 200, 48)} 
                            fill="none" 
                            stroke="#10b981" 
                            stroke-width="2" 
                        />
                    </svg>
                </div>
            </div>

            <!-- Sent -->
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-white/50">
                        <Wifi size={14} class="text-purple-500" />
                        <span class="text-xs font-bold uppercase tracking-wider">Packets Sent / sec</span>
                    </div>
                    <span class="text-lg font-black text-white">{sentStats.value}</span>
                </div>
                <div class="h-12 w-full">
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                        <path 
                            d={getSparklinePath(sentStats.data, 200, 48)} 
                            fill="none" 
                            stroke="#a855f7" 
                            stroke-width="2" 
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Storage Stats -->
    <div class="bg-[#0f111a] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group flex flex-col h-full">
        <div class="flex items-center gap-2 text-white/50 mb-4">
            <HardDrive size={16} />
            <h4 class="text-xs font-bold uppercase tracking-widest">Storage</h4>
        </div>

        <div class="flex items-baseline gap-4 mb-6">
            <div class="flex flex-col">
                <span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Bytes</span>
                <span class="text-lg font-black text-white">{storageStats.total}</span>
            </div>
            <div class="flex flex-col">
                <span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Pages</span>
                <span class="text-lg font-black text-white">{storageStats.pages}</span>
            </div>
             <div class="flex flex-col ml-auto text-right">
                <span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Last Updated</span>
                <span class="text-sm font-bold text-white/60">{storageStats.lastUpdated}</span>
            </div>
        </div>

        <div class="flex-1 min-h-[40px] opacity-30 mt-auto">
             <svg width="100%" height="40" preserveAspectRatio="none">
                <path 
                    d={getSparklinePath(storageStats.data, 400, 40)} 
                    fill="none" 
                    stroke="white" 
                    stroke-width="1"
                    stroke-dasharray="2 2"
                />
            </svg>
        </div>
    </div>
</div>
