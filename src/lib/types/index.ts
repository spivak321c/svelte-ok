
export interface PNode {
    id: string;
    name: string;
    pubkey: string;
    ip: string;
    version: string;
    status: 'active' | 'inactive' | 'syncing' | 'online' | 'offline' | 'delinquent' | 'warning';
    storage_capacity_gb: number;
    storage_used_gb: number;
    uptime_percentage: number;
    latency_ms: number;
    coordinates: {
        x: number;
        y: number;
        z: number;
    };
    location_region: string;
    // Added optional fields observed in usage
    country?: string;
    city?: string;
    geo_info?: {
        region?: string;
    };
    performance_score?: number;
    response_time?: number;
    uptime_score?: number;
    storage_usage_percent?: number;
    storage_capacity?: number;
    storage_used?: number;
    credits?: number;
    is_registered?: boolean;
    is_public?: boolean;
    network?: string;
    address: string; // existed in usage
    type?: string;
    ram_total?: number;
    ram_used?: number;

    // Geo
    lat?: number;
    lon?: number;
    // city & country already exist above, removing duplicates

    // New fields causing errors
    last_seen?: string | number;
    is_upgrade_needed?: boolean;
    port?: number;
    devnet_credits?: number;
    mainnet_credits?: number;
}

export interface RpcResponse {
    jsonrpc: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: number | string | null;
}

export interface RpcRequest {
    jsonrpc?: string;
    method: string;
    params?: any;
    id?: number | string;
}

export interface PaginationMeta {
    total_items: number;
    total_pages: number;
    page: number;
    limit: number;
}

export type SortField = 'storage' | 'uptime' | 'latency' | 'score' | 'credits' | 'performance'; // inferred from usage
export type SortOrder = 'asc' | 'desc';

export interface NodesResponse {
    nodes: PNode[];
    pagination: PaginationMeta;
}

export interface NodesQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    sort?: string;
    order?: string;
    include_offline?: boolean;
}

export enum ViewMode {
    DASHBOARD = 'DASHBOARD',
    EXPLORER_3D = 'EXPLORER_3D',
    PLAYGROUND = 'PLAYGROUND',
    NODES_LIST = 'NODES_LIST',
    HISTORICAL_ANALYSIS = 'HISTORICAL_ANALYSIS',
    PURCHASE = 'PURCHASE',
    ALERTS = 'ALERTS',
    STORAGE_PLANNER = 'STORAGE_PLANNER',
}

export interface AppSettings {
    rpcEndpoint: string;
    autoRefresh: boolean;
    refreshInterval: number; // in ms
    show3DOnMobile: boolean;
    theme: 'dark' | 'light';
    network: 'mainnet' | 'devnet';
}

// Missing API Types
export interface NetworkStats {
    network_health: number;
    total_nodes: number;
    online_nodes: number;
    total_storage_bytes: number;
    used_storage_bytes: number;
    total_pods?: number;
    average_storage_committed_per_pod_bytes?: number;
    last_updated?: string | number;

    // Advanced Stats
    average_cpu_percent?: number;
    average_ram_used_bytes?: number;
    average_ram_total_bytes?: number;
    average_uptime_seconds?: number;
    total_packets_received?: number;
    total_packets_sent?: number;
    nodes_with_rpc_stats?: number;

    // Node Counts
    total_public_nodes?: number;
    public_nodes?: number; // legacy alias
    online_public_nodes?: number;
    total_private_nodes?: number;
    private_nodes?: number; // legacy alias
    online_private_nodes?: number;
    offline_nodes?: number;
    devnet_node_count?: number;
    mainnet_node_count?: number;
    total_devnet_pods?: number;
    total_mainnet_pods?: number;

    // Storage extensions
    total_storage_pb?: number;
    used_storage_pb?: number;
}

export interface BackendStatus {
    status: string;
    version: string;
    uptime: number;
}

export interface CacheStatus {
    keys: number;
    hits: number;
    misses: number;
}

export interface NetworkSnapshot {
    timestamp: number | string; // Allow string for flexibility
    node_count?: number; // Keep existing
    storage_total?: number; // Keep existing
    storage_used?: number; // Keep existing
    // Add fields used in HistoricalAnalysis
    total_nodes?: number;
    average_uptime?: number;
    average_performance?: number;
}

export interface NodeHistoryPoint {
    timestamp: number;
    uptime: number;
    latency: number;
}

export interface CapacityForecast {
    current_usage: number;
    growth_rate: number;
    days_until_full: number;
}

export interface LatencyDistribution {
    buckets: { range: string; count: number }[];
}

export interface DailyHealthMetric {
    date: string;
    health_score: number;
}

export interface HighUptimeNode extends PNode {
    streak_days: number;
}

export interface StorageGrowthMetrics {
    daily_growth: number[];
    labels: string[];
}

export interface WeeklyComparison {
    current_week: NetworkStats;
    previous_week: NetworkStats;
    change_percent: number;
}

export interface NodeGraveyard {
    dead_nodes: PNode[];
}

export interface NodeCredits {
    pubkey: string;
    credits: number;
    mainnet_credits?: number;
    devnet_credits?: number;
}

export interface AllCreditsResponse {
    credits: NodeCredits[];
}

export interface TopCreditsResponse {
    top_nodes: NodeCredits[];
}

export interface RankCreditsResponse {
    ranks: NodeCredits[];
}

export interface CreditsStats {
    total_credits: number;
    avg_credits: number;
}

export interface NetworkTopology {
    nodes: Array<{ id: string; group: number }>;
    links: Array<{ source: string; target: string; value: number }>;
}

export interface RegionalCluster {
    region: string;
    count: number;
    coordinates: [number, number];
}

export interface CostComparison {
    providers: Array<{ name: string; cost: number }>;
}

export interface ROIEstimate {
    daily: number;
    monthly: number;
    yearly: number;
    roi_percent: number;
}

export interface RedundancySimulation {
    redundancy_level: number;
    reliability: number;
}

export type AlertRuleType = 'node_status' | 'storage_threshold' | 'latency_spike';

export interface AlertConditions {
    operator: 'eq' | 'gt' | 'lt';
    value: string | number;
    target_type?: 'global' | 'specific';
    node_id?: string;
}

export interface AlertAction {
    type: 'discord' | 'webhook' | 'email' | 'telegram';
    config: {
        url?: string;
        target?: string; // legacy support
    };
}

export interface Alert {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    rule_type: AlertRuleType;
    conditions: AlertConditions;
    actions: AlertAction[];
    cooldown_minutes?: number;
    last_fired?: string;
    created_at?: string;
    updated_at?: string;
    // Legacy fields for compatibility during migration if needed, but ideally we stick to new structure
    condition?: string;
    threshold?: number;
}

export interface CreateAlertRequest {
    name: string;
    description?: string;
    enabled: boolean;
    rule_type: AlertRuleType;
    conditions: any; // Using any to avoid strict type checks on complex conditions during early migration
    actions: AlertAction[];
    cooldown_minutes?: number;
}

export interface AlertHistoryItem {
    alert_name: string;
    timestamp: string;
    success: boolean;
    triggered_by: any;
}

export interface TestAlertResponse {
    success: boolean;
    message: string;
}

export interface CrossChainComparison {
    chain: string;
    tps: number;
    finality: number;
}
