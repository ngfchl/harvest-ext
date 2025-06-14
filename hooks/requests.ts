import {CommonResponse, Settings} from "@/types";

/**
 * 通用API请求函数
 * @param params
 */
export const fetchApi = async (params: {
    setting: Settings,
    path: string,
    method: string,
    data?: any,
    body?: any,
    contentType?: any,
}) => {
    const {setting, path, method = 'Get', data, body, contentType = "application/json",} = params;
    try {
        let url = `${setting.baseUrl}${path}`;
        const fetchOptions: RequestInit = {
            method,
            headers: {
                "Authorization": `Bearer Monkey.${setting.token}`,
                "Content-Type": contentType,
            },
        };
        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }
        if (body) {
            fetchOptions.body = body;
        }
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            let msg = `服务器连接失败! status: ${response.status}`;
            console.log(msg);
            return CommonResponse.error(-1, msg);
        }

        const res = await response.json();
        console.log(res);
        return res;
    } catch (error) {
        let msg = `服务器连接失败！${error}`;
        console.log(msg);
        return CommonResponse.error(-1, msg);
    }
}