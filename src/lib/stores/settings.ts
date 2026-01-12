import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { AppSettings } from '$types';

const DEFAULT_SETTINGS: AppSettings = {
    rpcEndpoint: 'https://api.xandeum.network',
    autoRefresh: true,
    refreshInterval: 7000,
    show3DOnMobile: false,
    theme: 'light',
    network: 'mainnet'
};

function createSettingsStore() {
    const { subscribe, set, update } = writable<AppSettings>(DEFAULT_SETTINGS);

    return {
        subscribe,
        set: (settings: AppSettings) => {
            set(settings);
            if (browser) {
                localStorage.setItem('app-settings', JSON.stringify(settings));
                updateTheme(settings.theme);
            }
        },
        update: (fn: (settings: AppSettings) => AppSettings) => {
            update(s => {
                const newSettings = fn(s);
                if (browser) {
                    localStorage.setItem('app-settings', JSON.stringify(newSettings));
                    updateTheme(newSettings.theme);
                }
                return newSettings;
            });
        },
        init: () => {
            if (browser) {
                const stored = localStorage.getItem('app-settings');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        set({ ...DEFAULT_SETTINGS, ...parsed });
                        updateTheme(parsed.theme);
                    } catch (e) {
                        console.error('Failed to parse settings', e);
                    }
                }
            }
        }
    };
}

function updateTheme(theme: 'light' | 'dark') {
    if (!browser) return;
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export const settings = createSettingsStore();
