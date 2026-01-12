import type { PNode } from '../types';

/**
 * Groups nodes by their public key and aggregates multiple IP addresses.
 * This prevents duplicate key errors in React and allows displaying all IPs for a node.
 */
export function groupNodesByPubKey(nodes: PNode[]): PNode[] {
    const grouped = new Map<string, PNode>();

    nodes.forEach(node => {
        const existing = grouped.get(node.pubkey);
        if (existing) {
            // Merge unique addresses
            // Use 'any' casting here if types are strict about optional properties
            // in PNode but we are adding runtime properties.
            // Ideally PNode type should have all_ips.
            const existingIps = (existing as any).all_ips || [existing.address];
            const newAddress = node.address;

            if (newAddress && !existingIps.includes(newAddress)) {
                (existing as any).all_ips = [...existingIps, newAddress];
                // Keep 'address' as the primary field for identification
            }

            // Keep the most recent 'last_seen' - assuming last_seen exists on PNode now based on usage,
            // or we just preserve logic. The original types.ts didn't have last_seen, 
            // but the util uses it. We should assume PNode in our new types 
            // has these fields or extend it.
            // For now, casting for safety if fields missing in strict type.
            const nodeLastSeen = (node as any).last_seen;
            const existingLastSeen = (existing as any).last_seen;

            if (new Date(nodeLastSeen || 0) > new Date(existingLastSeen || 0)) {
                (existing as any).last_seen = nodeLastSeen;
                existing.status = node.status;
                // existing.is_online = node.is_online; // Type error potential
            }
        } else {
            // Clone the node and initialize all_ips
            const newNode = { ...node };
            if (node.address) {
                (newNode as any).all_ips = [node.address];
            } else {
                (newNode as any).all_ips = [];
            }
            grouped.set(node.pubkey, newNode);
        }
    });

    return Array.from(grouped.values());
}
