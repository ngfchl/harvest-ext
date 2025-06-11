export interface Settings {
    baseUrl: string;
    token: string;
}

export interface Site {
    'id': number
    'name': string
    'url': string
    'logo': string
}

export interface RepeatInfo {
    url_list: {
        download_url: string
        details_url: string
        site: Site
    }[]
    can_list: Site[]
}

export interface Torrent {
    site_id: number
    tid: number
    title: string
    category: string
    completers?: string
    leechers?: string
    hr: boolean
    magnet_url: string
    poster: string
    published: string
    sale_expire: string
    sale_status: string
    seeders: string
    subtitle: string
    tags: string
    size: string
    hash_string?: string
    douban_url?: string
    imdb_url?: string
    files_count?: string
}

export interface Downloader {
    id: number
    name: string
    username?: string
    password?: string
    http?: 'http' | 'https'
    host?: string
    port?: number
    sort_id?: number
    category: string
}

export interface Category {
    name: string
    savePath: string
}