export type LocalStorageEntry = [string, string];

export const LOCAL_STORAGE_EXCLUDED_KEYS = [
    'myUid',
    'mySite',
    'website',
];

const decodeStoragePart = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export const serializeLocalStorageEntries = (
    entries: LocalStorageEntry[],
    excludedKeys: string[] = LOCAL_STORAGE_EXCLUDED_KEYS,
) => {
    const excludedKeySet = new Set(excludedKeys);

    return entries
        .filter(([key, value]) => key && value !== undefined && value !== null && !excludedKeySet.has(key))
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('; ');
}

const storageValueText = (value: unknown) => {
    if (value === undefined || value === null) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

const parseLocalStorageObject = (value: unknown): LocalStorageEntry[] => {
    if (Array.isArray(value)) {
        return value
            .map((item): LocalStorageEntry | null => {
                if (!Array.isArray(item) || item.length < 2) {
                    return null;
                }
                return [String(item[0]), storageValueText(item[1])];
            })
            .filter((item): item is LocalStorageEntry => Boolean(item?.[0]));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .filter(([key]) => Boolean(key))
            .map(([key, item]) => [key, storageValueText(item)]);
    }

    return [];
}

export const serializeLocalStorage = (storage: Storage = window.localStorage) => {
    const entries: LocalStorageEntry[] = [];
    for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key) {
            continue;
        }
        entries.push([key, storage.getItem(key) || '']);
    }

    return serializeLocalStorageEntries(entries);
}

export const parseLocalStorageString = (value: unknown): LocalStorageEntry[] => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value) || typeof value === 'object') {
        return parseLocalStorageObject(value);
    }

    const text = String(value).trim();
    if (text.startsWith('{') || text.startsWith('[')) {
        try {
            return parseLocalStorageObject(JSON.parse(text));
        } catch {
            // Fall back to key=value parsing below.
        }
    }

    return text
        .split(';')
        .map((item): LocalStorageEntry | null => {
            const text = item.trim();
            if (!text) {
                return null;
            }
            const separatorIndex = text.indexOf('=');
            if (separatorIndex <= 0) {
                return null;
            }

            return [
                decodeStoragePart(text.slice(0, separatorIndex).trim()),
                decodeStoragePart(text.slice(separatorIndex + 1).trim()),
            ];
        })
        .filter((item): item is LocalStorageEntry => Boolean(item?.[0]));
}
