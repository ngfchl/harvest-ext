export interface Settings {
    baseUrl: string;
    imgUrl: string;
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

// 铂金学院 PT 站点配置接口
export interface WebSite {
    url: string[];
    name: string;
    nickname: string;
    logo: string;
    tracker: string;
    sp_full: number;
    limit_speed: number;
    tags: string;
    iyuu: number;
    sign_in: boolean;
    get_info: boolean;
    repeat_torrents: boolean;
    brush_free: boolean;
    brush_rss: boolean;
    hr_discern: boolean;
    search_torrents: boolean;
    page_index: string;
    page_torrents: string;
    page_sign_in: string;
    page_control_panel: string;
    page_detail: string;
    page_download: string;
    page_user: string;
    page_search: string;
    page_message: string;
    page_hr: string;
    page_leeching: string;
    page_uploaded: string;
    page_seeding: string;
    page_completed: string;
    page_mybonus: string;
    page_viewfilelist: string;
    sign_info_title: string;
    sign_info_content: string;
    hr: boolean;
    hr_rate: number;
    hr_time: number;
    my_invitation_rule: string;
    my_time_join_rule: string;
    my_latest_active_rule: string;
    my_uploaded_rule: string;
    my_downloaded_rule: string;
    my_ratio_rule: string;
    my_bonus_rule: string;
    my_per_hour_bonus_rule: string;
    my_score_rule: string;
    my_level_rule: string;
    my_passkey_rule: string;
    my_uid_rule: string;
    my_hr_rule: string;
    my_leech_rule: string;
    my_publish_rule: string;
    my_seed_rule: string;
    my_seed_vol_rule: string;
    my_mailbox_rule: string;
    my_message_title: string;
    my_notice_rule: string;
    my_notice_title: string;
    my_notice_content: string;
    torrents_rule: string;
    torrent_title_rule: string;
    torrent_subtitle_rule: string;
    torrent_detail_url_rule: string;
    torrent_category_rule: string;
    torrent_poster_rule: string;
    torrent_magnet_url_rule: string;
    torrent_size_rule: string;
    torrent_progress_rule: string;
    torrent_hr_rule: string;
    torrent_sale_rule: string;
    torrent_sale_expire_rule: string;
    torrent_release_rule: string;
    torrent_seeders_rule: string;
    torrent_leechers_rule: string;
    torrent_completers_rule: string;
    detail_title_rule: string;
    detail_subtitle_rule: string;
    detail_download_url_rule: string;
    detail_size_rule: string;
    detail_category_rule: string;
    detail_count_files_rule: string;
    detail_hash_rule: string;
    detail_free_rule: string;
    detail_free_expire_rule: string;
    detail_douban_rule: string;
    detail_imdb_rule: string;
    detail_poster_rule: string;
    detail_tags_rule: string;
    torrent_tags_rule: string;
    detail_hr_rule: string;
    alive: boolean;
    page_pieces_hash_api: string;
    pieces_repeat: boolean;
    proxy: boolean;
    imdb_search: string;
    structure: string;
    type: string;
    nation: string;
    my_email_rule: string;
    my_username_rule: string;
    buy_page: string;
    buy_action: {
        "100GB上传流量": string;
        "100GB下载流量": string;
        "1个邀请名额": string;
        "1个临时邀请名额": string;
        "贵宾待遇": string;
    };
    level: {
        User: LevelInfo;
        PowerUser: LevelInfo;
        EliteUser: LevelInfo;
        CrazyUser: LevelInfo;
        InsaneUser: LevelInfo;
        VeteranUser: LevelInfo;
        ExtremeUser: LevelInfo;
        UltimateUser: LevelInfo;
        NexusMaster: LevelInfo;
        VIP: LevelInfo;
    };
}

// 等级信息接口
export interface LevelInfo {
    level_id: number;
    level: string;
    days: number;
    uploaded: string;
    downloaded: string;
    bonus: number;
    score: number;
    ratio: number;
    torrents: number;
    leeches: number;
    seeding_delta: number;
    keep_account: boolean;
    graduation: boolean;
    rights: string;
}

/**
 * 站点模型接口
 */
export interface MySite {
    /** 站点名称，唯一标识 */
    id: number;
    /** 站点名称，唯一标识 */
    site: string;
    /** 站点昵称 */
    nickname: string;
    /** 排序ID，默认值为1 */
    sort_id: number;

    /* ------------------ 用户信息 ------------------ */
    /** 用户ID，数字UID或用户名 */
    user_id: string | null;
    /** 用户名称 */
    username: string | null;
    /** 注册邮箱 */
    email: string | null;
    /** PassKey */
    passkey: string | null;
    /** AuthKey */
    authkey: string | null;
    /** Cookies，与UA搭配使用效果更佳 */
    cookie: string;
    /** User-Agent，获取cookie的浏览器UA */
    user_agent: string;
    /** RSS地址 */
    rss: string | null;
    /** 种子地址 */
    torrents: string | null;

    /* ------------------ 用户设置 ------------------ */
    /** 站点是否可用，默认值为true */
    available: boolean;
    /** 是否开启签到，默认值为true */
    sign_in: boolean;
    /** 是否抓取站点数据，默认值为true */
    get_info: boolean;
    /** 是否支持辅种，默认值为true */
    repeat_torrents: boolean;
    /** 是否开启Free刷流，默认值为true */
    brush_free: boolean;
    /** 是否开启RSS刷流，默认值为false */
    brush_rss: boolean;
    /** 是否开启拆包刷流，默认值为true */
    package_file: boolean;
    /** 是否下载HR种子，默认值为false */
    hr_discern: boolean;
    /** 是否开启搜索，默认值为true */
    search_torrents: boolean;
    /** 是否在首页展示，默认值为true */
    show_in_dash: boolean;
    /** 代理服务器地址 */
    proxy: string | null;
    /** 删种规则，JSON格式 */
    remove_torrent_rules: object | null;
    /** 访问地址 */
    mirror: string | null;

    /* ------------------ 用户数据（自动拉取） ------------------ */
    /** 注册时间，默认值为当前时间 */
    time_join: Date;
    /** 最后访问时间 */
    latest_active: Date | null;
    /** 短消息数量，默认值为0 */
    mail: number;
    /** 公告数量，默认值为0 */
    notice: number;
    /** 签到信息，JSON格式 */
    sign_info: SignInfoByDate;
    /** 站点数据，JSON格式 */
    status: StatusByDate;
}

/**
 * 站点状态接口（按日期分类）
 */
interface StatusByDate {
    [date: string]: StatusInfo;
}

/**
 * 单个日期的状态信息接口
 */
interface StatusInfo {
    ratio: number;
    downloaded: number;
    uploaded: number;
    my_bonus: number;
    my_score: number;
    seed: number;
    leech: number;
    invitation: number;
    publish: number;
    seed_days: number;
    my_hr: string;
    my_level: string;
    seed_volume: number;
    updated_at: string; // 日期时间格式
    bonus_hour: string;
    created_at: string; // 日期时间格式
}

/**
 * 签到信息接口（按日期分类）
 */
interface SignInfoByDate {
    [date: string]: SignInfo;
}

/**
 * 单个日期的签到信息接口
 */
interface SignInfo {
    time?: string; // 部分日期使用time
    updated_at?: string; // 部分日期使用updated_at
    info: string; // 签到详情信息
}

export interface CacheData {
    data: object
    timestamp: number
    expireTime: number
}