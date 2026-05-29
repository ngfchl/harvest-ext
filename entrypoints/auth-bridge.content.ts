export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_start',
    world: 'MAIN',
    globalName: false,
    noScriptStartedPostMessage: true,
    main() {
        const harvestWindow = window as any;
        if (harvestWindow.__harvest_api_auth_bridge_installed__) {
            return;
        }

        const currentHost = window.location.hostname.toLowerCase();
        const isTokenSite = currentHost.includes('m-team')
            || currentHost.includes('mteam')
            || currentHost.includes('rousi');
        if (!isTokenSite) {
            return;
        }

        harvestWindow.__harvest_api_auth_bridge_installed__ = true;

        const tokenFromStorage = () => {
            const keys = ['auth', 'token', 'accessToken', 'access_token', 'jwt'];
            for (const key of keys) {
                try {
                    const value = window.localStorage.getItem(key);
                    if (value && String(value).trim().length > 0) {
                        return String(value).trim();
                    }
                } catch {
                    // Ignore storage read errors.
                }
            }
            return '';
        };

        const authHeader = () => {
            const token = tokenFromStorage();
            if (!token) {
                return '';
            }
            return token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;
        };

        const apiHosts = () => {
            const hosts = new Set<string>();
            const addHost = (value: unknown) => {
                if (!value) {
                    return;
                }
                try {
                    const url = new URL(String(value), window.location.href);
                    if (url.host) {
                        hosts.add(url.host.toLowerCase());
                    }
                } catch {
                    // Ignore invalid URL values.
                }
            };

            ['apiHost', 'api_host', 'baseApi', 'base_api', 'apiBase', 'api_base'].forEach((key) => {
                try {
                    addHost(window.localStorage.getItem(key));
                } catch {
                    // Ignore storage read errors.
                }
            });

            if (currentHost.includes('m-team')) {
                hosts.add('api.m-team.cc');
                hosts.add('api2.m-team.cc');
                hosts.add('api.m-team.io');
                hosts.add('api2.m-team.io');
            }
            return hosts;
        };

        const shouldAttachAuth = (value: unknown) => {
            if (!value) {
                return false;
            }
            try {
                const url = new URL(String(value), window.location.href);
                return apiHosts().has(url.host.toLowerCase());
            } catch {
                return false;
            }
        };

        if (typeof window.fetch === 'function') {
            const nativeFetch = window.fetch.bind(window);
            window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
                try {
                    const target = input && typeof input === 'object' && 'url' in input ? input.url : input;
                    const headerValue = authHeader();
                    if (!headerValue || !shouldAttachAuth(target)) {
                        return nativeFetch(input, init);
                    }
                    const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
                    if (init?.headers) {
                        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
                    }
                    if (!headers.has('authorization')) {
                        headers.set('Authorization', headerValue);
                    }
                    return nativeFetch(input, {
                        ...(init || {}),
                        headers,
                    });
                } catch {
                    return nativeFetch(input, init);
                }
            };
        }

        const xhr = window.XMLHttpRequest && window.XMLHttpRequest.prototype as any;
        if (xhr?.open && xhr?.send && xhr?.setRequestHeader) {
            const nativeOpen = xhr.open;
            const nativeSend = xhr.send;
            const nativeSetRequestHeader = xhr.setRequestHeader;
            xhr.open = function (...args: any[]) {
                this.__harvest_auth_url = args[1];
                this.__harvest_has_auth_header = false;
                return nativeOpen.apply(this, args);
            };
            xhr.setRequestHeader = function (name: string, value: string) {
                if (String(name || '').toLowerCase() === 'authorization') {
                    this.__harvest_has_auth_header = true;
                }
                return nativeSetRequestHeader.call(this, name, value);
            };
            xhr.send = function (...args: any[]) {
                try {
                    const headerValue = authHeader();
                    if (headerValue && !this.__harvest_has_auth_header && shouldAttachAuth(this.__harvest_auth_url)) {
                        nativeSetRequestHeader.call(this, 'Authorization', headerValue);
                    }
                } catch {
                    // Ignore bridge errors and send normally.
                }
                return nativeSend.apply(this, args);
            };
        }
    },
});
