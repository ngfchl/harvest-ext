export interface Settings {
    baseUrl: string;
    token: string;
}

export interface SiteInfo {
    mysite: number
    website: object | null
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


/**
 * 统一的JSON返回格式
 */
export /**
 * 统一的JSON返回格式
 */
class CommonResponse<T> {
    code: number;
    msg: string | null;
    data: T | null;
    succeed: boolean;

    constructor(code: number = 0, data: T | null = null, msg: string = '', succeed: boolean = true) {
        this.code = code;
        this.data = data;
        this.msg = msg;
        this.succeed = succeed;
    }

    /**
     * 创建成功响应
     * @param data 响应数据
     * @param msg 响应消息
     */
    static success<T>(data: T | null = null, msg: string = ''): CommonResponse<T> {
        return new CommonResponse<T>(0, data, msg, true);
    }

    /**
     * 创建错误响应
     * @param code 错误码
     * @param msg 错误消息
     * @param data 错误数据
     */
    static error<T>(code: number = -1, msg: string = '', data: T | null = null): CommonResponse<T> {
        return new CommonResponse<T>(code, data, msg, false);
    }

    /**
     * 转换为对象
     */
    toObject(): { code: number; msg: string | null; data: T | null; succeed: boolean } {
        return {
            code: this.code,
            msg: this.msg,
            data: this.data,
            succeed: this.succeed,
        };
    }

    /**
     * 转换为JSON字符串
     */
    toJson(): string {
        return JSON.stringify(this.toObject());
    }
}