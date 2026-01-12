<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        goto("/dashboard");
    });
</script>

<div class="flex items-center justify-center h-screen">
    <p>Redirecting...</p>
</div>
