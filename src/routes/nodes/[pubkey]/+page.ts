import { error } from '@sveltejs/kit';
import { apiService } from '$services/api'; // Fix aliases in build if needed
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    try {
        const node = await apiService.getNode(params.pubkey);
        // We could also fetch history here in parallel, but might delay TTI.
        // Let's fetch basic node info here.
        return {
            node
        };
    } catch (e) {
        throw error(404, 'Node not found');
    }
};
