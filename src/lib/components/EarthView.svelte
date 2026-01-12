<script lang="ts">
    import { onMount } from "svelte";
    import { RefreshCw, Globe, Plus, Minus } from "lucide-svelte";
    import type { PNode } from "$lib/types";
    import type { NetworkStats } from "$lib/types";

    export let nodes: PNode[] = [];
    export let stats: NetworkStats | null = null;
    export let onNodeClick: ((node: PNode) => void) | undefined = undefined;
    export let selectedNodeId: string | null = null;
    export let lastUpdated: Date | null = null;
    export let refetch: (() => void) | undefined = undefined;
    export let isRefetching = false;

    const GEOJSON_URL =
        "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson";

    interface GeoJSONFeature {
        type: string;
        properties: { [key: string]: unknown };
        geometry: {
            type: "Polygon" | "MultiPolygon";
            coordinates: number[][][] | number[][][][];
        };
    }

    interface GeoJSONData {
        type: string;
        features: GeoJSONFeature[];
    }

    let geoData: GeoJSONData | null = null;
    let hoveredNode: PNode | null = null;
    let containerRef: HTMLDivElement;
    let scale = 1.8;
    let position = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let hasDragged = false;

    let mapError: string | null = null;
    let loading = true;

    onMount(() => {
        fetch(GEOJSON_URL)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load map data");
                return res.json();
            })
            .then((data: GeoJSONData) => {
                geoData = data;
                loading = false;
            })
            .catch((err) => {
                console.error("Failed to load map data", err);
                mapError = err.message;
                loading = false;
            });
    });

    function getNodeColor(status: string): string {
        switch (status.toLowerCase()) {
            case "active":
            case "online":
                return "#008E7C";
            case "delinquent":
            case "warning":
                return "#FE8300";
            case "offline":
                return "#f87171";
            default:
                return "#6E6E7E";
        }
    }

    function project(lat: number, lon: number) {
        const x = (lon + 180) * (100 / 360);
        const y = (90 - lat) * (100 / 180);
        return { x, y };
    }

    function getProjectedPos(node: any) {
        return project(node.lat || 0, node.lon || 0);
    }

    function generatePath(
        coordinates: number[][][] | number[][][][],
        type: "Polygon" | "MultiPolygon",
    ): string {
        const coordToPoint = (lon: number, lat: number) => {
            const x = (lon + 180) * (1000 / 360);
            const y = (90 - lat) * (500 / 180);
            return `${x},${y} `;
        };

        if (type === "Polygon") {
            return (coordinates as number[][][])
                .map((ring: number[][]) => {
                    return (
                        "M" +
                        ring
                            .map((pt: number[]) => coordToPoint(pt[0], pt[1]))
                            .join("L") +
                        "Z"
                    );
                })
                .join(" ");
        } else if (type === "MultiPolygon") {
            return (coordinates as number[][][][])
                .map((polygon: number[][][]) => {
                    return polygon
                        .map((ring: number[][]) => {
                            return (
                                "M" +
                                ring
                                    .map((pt: number[]) =>
                                        coordToPoint(pt[0], pt[1]),
                                    )
                                    .join("L") +
                                "Z"
                            );
                        })
                        .join(" ");
                })
                .join(" ");
        }
        return "";
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const ZOOM_SPEED = 0.001;
        const newScale = Math.min(
            Math.max(1, scale - e.deltaY * ZOOM_SPEED * scale * 2),
            8,
        );

        if (containerRef) {
            const rect = containerRef.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const contentX = (mouseX - position.x) / scale;
            const contentY = (mouseY - position.y) / scale;

            let newX = mouseX - contentX * newScale;
            let newY = mouseY - contentY * newScale;

            if (newScale === 1) {
                newX = 0;
                newY = 0;
            }

            scale = newScale;
            position = { x: newX, y: newY };
        }
    }

    function handleMouseDown(e: MouseEvent) {
        isDragging = true;
        hasDragged = false;
        dragStart = { x: e.clientX - position.x, y: e.clientY - position.y };
    }

    function handleMouseMove(e: MouseEvent) {
        if (isDragging) {
            hasDragged = true;
            position = {
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            };
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleZoomIn() {
        const newScale = Math.min(scale * 1.5, 8);
        if (containerRef) {
            const rect = containerRef.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const contentX = (centerX - position.x) / scale;
            const contentY = (centerY - position.y) / scale;
            const newX = centerX - contentX * newScale;
            const newY = centerY - contentY * newScale;
            scale = newScale;
            position = { x: newX, y: newY };
        } else {
            scale = newScale;
        }
    }

    function handleZoomOut() {
        const newScale = Math.max(scale / 1.5, 1);
        if (newScale === 1) {
            scale = 1;
            position = { x: 0, y: 0 };
        } else if (containerRef) {
            const rect = containerRef.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const contentX = (centerX - position.x) / scale;
            const contentY = (centerY - position.y) / scale;
            const newX = centerX - contentX * newScale;
            const newY = centerY - contentY * newScale;
            scale = newScale;
            position = { x: newX, y: newY };
        } else {
            scale = newScale;
        }
    }

    $: timeAgo = (() => {
        if (!lastUpdated) return "Never";
        const seconds = Math.floor(
            (new Date().getTime() - lastUpdated.getTime()) / 1000,
        );
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
    })();

    $: regionMap = (() => {
        const map = new Map<string, { count: number; capacity: number }>();
        (nodes || []).forEach((n) => {
            const region = n.country || "Unknown";
            const current = map.get(region) || { count: 0, capacity: 0 };
            map.set(region, {
                count: current.count + 1,
                capacity: current.capacity + (n.storage_capacity ?? 0) / 1e12,
            });
        });
        return map;
    })();

    $: regions = Array.from(regionMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count);

    $: topRegion = regions[0];
    $: totalNodes = stats?.total_nodes ?? nodes?.length ?? 0;
    $: topRegionPercent =
        topRegion && totalNodes > 0 ? (topRegion.count / totalNodes) * 100 : 0;
    $: isConcentrated = topRegionPercent > 40;

</script>

<svelte:window on:mouseup={handleMouseUp} />

<div
    class="w-full h-full bg-background relative overflow-hidden transition-colors duration-300"
>
    <!-- 2D Map View -->
    <div
        class="w-full h-full bg-background relative overflow-hidden flex items-center justify-center"
    >
        <!-- Viewport Container -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            bind:this={containerRef}
            class="w-full h-full overflow-hidden cursor-move relative flex items-center justify-center outline-none"
            on:wheel|nonpassive={handleWheel}
            on:mousedown|preventDefault={handleMouseDown}
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseUp}
            role="img"
            aria-label="Interactive world map showing node locations"
            tabindex="0"
        >
            {#if loading}
                <div
                    class="absolute inset-0 flex items-center justify-center z-50 text-muted-foreground animate-pulse"
                >
                    <Globe class="w-8 h-8 mr-2 animate-spin" /> Loading Map Data...
                </div>
            {:else if mapError}
                <div
                    class="absolute inset-0 flex items-center justify-center z-50 text-destructive"
                >
                    Map Error: {mapError}
                </div>
            {/if}
            <!-- Transformable Content -->
            <div
                style="transform: translate({position.x}px, {position.y}px) scale({scale}); transform-origin: 0 0; transition: {isDragging
                    ? 'none'
                    : 'transform 0.1s ease-out'};"
                class="relative"
            >
                <div
                    class="relative w-[1200px] h-[600px] max-w-none select-none p-4"
                >
                    <!-- World Map SVG -->
                    <svg
                        viewBox="0 0 1000 500"
                        class="w-full h-full filter drop-shadow-2xl"
                    >
                        <!-- Background Ocean -->
                        <rect
                            width="1000"
                            height="500"
                            rx="12"
                            fill="var(--bg-background)"
                        />

                        <!-- Grid Lines -->
                        <path
                            d="M0,250 L1000,250"
                            class="stroke-border"
                            stroke-width="1"
                            stroke-dasharray="4 4"
                            opacity="0.5"
                        />
                        <path
                            d="M500,0 L500,500"
                            class="stroke-border"
                            stroke-width="1"
                            stroke-dasharray="4 4"
                            opacity="0.5"
                        />

                        <!-- Countries -->
                        {#if geoData}
                            {#each geoData.features as feature, i}
                                <path
                                    d={generatePath(
                                        feature.geometry.coordinates,
                                        feature.geometry.type,
                                    )}
                                    stroke-width="0.5"
                                    fill="var(--muted)"
                                    stroke="var(--border)"
                                    class="hover:fill-primary transition-colors duration-300"
                                />
                            {/each}
                        {/if}
                    </svg>

                    <!-- Nodes Layer -->
                    <div class="absolute inset-0 m-4 pointer-events-none">
                        {#each nodes as node (node.pubkey)}
                            {@const pos = getProjectedPos(node)}
                            {@const isSelected = selectedNodeId === node.pubkey}
                            {@const color = getNodeColor(node.status)}
                            {@const capacityTB =
                                (node.storage_capacity ?? 0) / 1e12}
                            {@const nodeSize = Math.min(
                                3.5,
                                Math.max(1.5, 1.5 + capacityTB / 50),
                            )}

                            <div
                                class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
                                style="left: {pos.x}%; top: {pos.y}%;"
                                on:click={(e) => {
                                    e.stopPropagation();
                                    if (!hasDragged) {
                                        onNodeClick?.(node);
                                    }
                                }}
                                on:mouseenter={() => (hoveredNode = node)}
                                on:mouseleave={() => (hoveredNode = null)}
                                role="button"
                                tabindex="0"
                                aria-label="Node {node.pubkey.substring(0, 8)}"
                            >
                                <div
                                    class="relative transition-all duration-300 {isSelected
                                        ? 'scale-150 z-20'
                                        : 'hover:scale-150 hover:z-10'}"
                                >
                                    {#if isSelected || hoveredNode === node}
                                        <div
                                            class="absolute -inset-2 border border-white/40 rounded-full animate-ping"
                                        ></div>
                                    {/if}

                                    <div
                                        class="rounded-full shadow-lg"
                                        style="width: {nodeSize *
                                            4}px; height: {nodeSize *
                                            4}px; background-color: {color}; box-shadow: 0 0 {nodeSize *
                                            3}px {color};"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>

                    <!-- Tooltip Overlay -->
                    {#if hoveredNode}
                        {@const pos = getProjectedPos(hoveredNode)}
                        <div
                            class="absolute z-50 pointer-events-none"
                            style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -150%) scale({1 /
                                scale}); transform-origin: bottom center;"
                        >
                            <div
                                class="bg-card/95 backdrop-blur-md border border-border p-3 rounded-xl text-left shadow-2xl min-w-[160px]"
                            >
                                <div
                                    class="flex items-center justify-between mb-1"
                                >
                                    <span
                                        class="text-[10px] font-bold text-primary font-mono"
                                        >NODE ID</span
                                    >
                                    <div
                                        class="w-1.5 h-1.5 rounded-full"
                                        style="background-color: {getNodeColor(
                                            hoveredNode.status,
                                        )};"
                                    ></div>
                                </div>
                                <p
                                    class="text-xs font-bold text-foreground mb-2 font-mono"
                                >
                                    {hoveredNode.pubkey.substring(0, 10)}...
                                </p>

                                <div class="space-y-1">
                                    <div
                                        class="flex justify-between text-[10px] text-muted-foreground"
                                    >
                                        <span>Region</span>
                                        <span class="text-foreground"
                                            >{hoveredNode.city ||
                                                hoveredNode.country}</span
                                        >
                                    </div>
                                    {#if hoveredNode.response_time !== undefined}
                                        <div
                                            class="flex justify-between text-[10px] text-muted-foreground"
                                        >
                                            <span>Latency</span>
                                            <span class="text-secondary"
                                                >{hoveredNode.response_time} ms</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            <div
                                class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-card absolute left-1/2 -translate-x-1/2 -bottom-1.5"
                            ></div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Zoom Controls -->
        <div
            class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-none"
        >
            <div
                class="bg-card/50 backdrop-blur px-4 py-2 rounded-full border border-border text-xs font-mono text-muted-foreground pointer-events-auto flex items-center gap-3"
            >
                <span class="mr-2 border-r border-border pr-3"
                    >NETWORK EXPLORER</span
                >
                <button
                    on:click={handleZoomOut}
                    class="hover:text-foreground transition-colors"
                    ><Minus size={14} /></button
                >
                <span class="text-[10px] w-8 text-center text-foreground"
                    >{(scale * 100).toFixed(0)}%</span
                >
                <button
                    on:click={handleZoomIn}
                    class="hover:text-foreground transition-colors"
                    ><Plus size={14} /></button
                >
            </div>
        </div>

        <!-- Status Legend -->
        <div
            class="absolute bottom-6 left-6 z-10 pointer-events-none hidden md:block"
        >
            <div
                class="bg-card/80 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg"
            >
                <div
                    class="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground uppercase font-bold"
                >
                    Network Status
                </div>
                <div class="space-y-1">
                    <div
                        class="flex items-center text-[10px] text-muted-foreground gap-2"
                    >
                        <div
                            class="w-2.5 h-2.5 rounded-full"
                            style="background-color: {getNodeColor('active')};"
                        ></div>
                        Healthy
                    </div>
                    <div
                        class="flex items-center text-[10px] text-muted-foreground gap-2"
                    >
                        <div
                            class="w-2.5 h-2.5 rounded-full"
                            style="background-color: {getNodeColor(
                                'delinquent',
                            )};"
                        ></div>
                        Degraded
                    </div>
                    <div
                        class="flex items-center text-[10px] text-muted-foreground gap-2"
                    >
                        <div
                            class="w-2.5 h-2.5 rounded-full"
                            style="background-color: {getNodeColor('offline')};"
                        ></div>
                        Offline
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- UI: Geo Summary Panel -->
    <div class="absolute top-4 left-4 z-10 pointer-events-none">
        <div
            class="bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl text-foreground w-72"
        >
            <h3
                class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center"
            >
                <Globe class="w-3 h-3 mr-2 text-primary" /> Geo Summary
            </h3>

            <div class="space-y-2 mb-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted-foreground">Total Nodes</span>
                    <span class="font-bold font-mono">{totalNodes}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted-foreground">Regions</span>
                    <span class="font-bold font-mono">{regions.length}</span>
                </div>
                {#if topRegion}
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-muted-foreground">Top Region</span>
                        <span class="font-bold text-xs">{topRegion.name}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-muted-foreground">Concentration</span>
                        <span
                            class="font-bold font-mono {isConcentrated
                                ? 'text-accent'
                                : 'text-secondary'}"
                        >
                            {topRegionPercent.toFixed(0)}%
                        </span>
                    </div>
                {/if}
            </div>

            <div
                class="text-[10px] px-2 py-1.5 rounded {isConcentrated
                    ? 'bg-accent/10 text-accent'
                    : 'bg-secondary/10 text-secondary'}"
            >
                {isConcentrated
                    ? "⚠️ High concentration"
                    : "✓ Balanced distribution"}
            </div>

            <div
                class="flex justify-between items-center pt-3 mt-3 border-t border-border pointer-events-auto"
            >
                <span class="text-[9px] text-muted-foreground"
                    >Updated: {timeAgo}</span
                >
                <button
                    on:click={() => refetch?.()}
                    class="p-1.5 hover:bg-muted rounded transition-colors {isRefetching
                        ? 'animate-spin text-primary'
                        : 'text-muted-foreground hover:text-foreground'}"
                >
                    <RefreshCw size={12} />
                </button>
            </div>
        </div>
    </div>

    <!-- Enhanced Legend -->
    <div class="absolute bottom-6 right-6 z-10 pointer-events-none">
        <div
            class="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 shadow-lg"
        >
            <div
                class="text-[9px] text-muted-foreground uppercase font-bold mb-2 flex items-center"
            >
                <Globe size={10} class="mr-1 text-primary" /> Node Status
            </div>
            <div class="space-y-1.5">
                <div
                    class="flex items-center text-[10px] text-muted-foreground"
                >
                    <span
                        class="w-2 h-2 rounded-full bg-[#008E7C] mr-2 shadow-[0_0_5px_#008E7C]"
                    ></span> Active
                </div>
                <div
                    class="flex items-center text-[10px] text-muted-foreground"
                >
                    <span class="w-2 h-2 rounded-full bg-[#FE8300] mr-2"></span>
                    Delinquent
                </div>
                <div
                    class="flex items-center text-[10px] text-muted-foreground"
                >
                    <span class="w-2 h-2 rounded-full bg-[#f87171] mr-2"></span>
                    Offline
                </div>
            </div>
            <div
                class="mt-3 pt-2 border-t border-border text-[9px] text-muted-foreground"
            >
                Size = Storage capacity
            </div>
        </div>
    </div>
</div>
