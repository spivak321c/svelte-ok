<script lang="ts">
    import { onMount } from "svelte";

    export let lat: number;
    export let lon: number;

    interface GeoFeature {
        geometry: {
            coordinates: number[][][] | number[][][][];
            type: string;
        };
    }

    let geoData: { features: GeoFeature[] } | null = null;

    onMount(() => {
        fetch(
            "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson",
        )
            .then((res) => res.json())
            .then((data) => (geoData = data));
    });

    // Simple projection logic
    function project(latitude: number, longitude: number) {
        const x = (longitude + 180) * (400 / 360);
        const y = (90 - latitude) * (200 / 180);
        return { x, y };
    }

    function generatePath(
        coordinates: number[][][] | number[][][][],
        type: string,
    ): string {
        const coordToPoint = (ln: number, lt: number) => {
            const p = project(lt, ln);
            return `${p.x},${p.y}`;
        };

        if (type === "Polygon") {
            return (coordinates as number[][][])
                .map((ring) => {
                    return (
                        "M" +
                        ring.map((pt) => coordToPoint(pt[0], pt[1])).join("L") +
                        "Z"
                    );
                })
                .join(" ");
        } else if (type === "MultiPolygon") {
            return (coordinates as number[][][][])
                .map((polygon) => {
                    return polygon
                        .map((ring) => {
                            return (
                                "M" +
                                ring
                                    .map((pt) => coordToPoint(pt[0], pt[1]))
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

    $: nodePos = project(lat, lon);
</script>

<div
    class="w-full h-full bg-[#0C0D12] rounded-lg overflow-hidden relative border border-border"
>
    <svg viewBox="0 0 400 200" class="w-full h-full opacity-50">
        {#if geoData}
            {#each geoData.features as feature}
                <path
                    d={generatePath(
                        feature.geometry.coordinates,
                        feature.geometry.type,
                    )}
                    fill="#2A2C3A"
                    stroke="none"
                />
            {/each}
        {/if}
    </svg>
    <!-- The Node Pin -->
    <div
        class="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)] border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
        style="left: {(nodePos.x / 400) * 100}%; top: {(nodePos.y / 200) *
            100}%"
    ></div>
    <!-- Crosshairs -->
    <div
        class="absolute w-full h-[1px] bg-primary/20 pointer-events-none"
        style="top: {(nodePos.y / 200) * 100}%"
    ></div>
    <div
        class="absolute h-full w-[1px] bg-primary/20 pointer-events-none"
        style="left: {(nodePos.x / 400) * 100}%"
    ></div>
</div>
