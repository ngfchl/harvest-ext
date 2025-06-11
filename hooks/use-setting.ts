import {Settings} from "@/types";
import {defineStore} from "pinia";
import {ref} from "vue";
import {message} from "ant-design-vue";

export const useSettingStore = defineStore("setting", () => {
    const setting = ref<Settings>({
        baseUrl: 'http://192.168.123.5:35173/', token: '&ze3pmoe'
    })
    const canSave = ref(false);

    // 从存储加载设置
    const getSetting = async () => {
        try {
            const data = await storage.getItem("local:setting");
            if (data) {
                setting.value = data as Settings;
                return true;
            }
            setting.value = {
                baseUrl: 'http://192.168.123.5:35173/', token: '&ze3pmoe'
            }
            return false;
        } catch (error) {
            console.error("获取设置失败:", error);
            return false;
        }
    };

    // 保存设置到存储
    const saveSetting = async (newSetting: Settings) => {
        try {
            // 更新状态
            setting.value = newSetting;
            // 保存到存储
            await storage.setItem("local:setting", newSetting);
            message.success("服务器信息保存成功！");
            return true;
        } catch (error) {
            console.error("保存设置失败:", error);
            message.error(`服务器信息保存失败！${error}`);
            return false;
        }
    };


    // 自动初始化 - 正确处理Promise
    const initialize = async () => {
        await getSetting();
    };

    // 立即执行初始化，但不阻塞其他代码
    initialize().catch(error => {
        console.error("初始化设置失败:", error);
    });
    /**
     * 获取站点相关规则
     * @param {string} host - 站点域名
     * @returns {Promise<Object|null>} 站点信息对象或null
     */
    const getSite = async (host: string): Promise<Object | null> => {
        console.log(setting.value.baseUrl);
        const path = "api/auth/monkey/get_site/"

        try {
            // 处理m-team域名特殊规则
            if (host.includes("m-team")) {
                host = host.replace("xp.", "api.")
                host = host.replace("kp.", "api.")
            }
            let url = `${setting.value.baseUrl}${path}${host}`
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer Monkey.${setting.value.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                let msg = `HTTP error! status: ${response.status}`
                message.warning(msg, 10000);
                throw new Error(msg);
            }

            const res = await response.json();
            console.log(res);

            if (res.code !== 0) {
                const msg = `获取站点信息出错：${res.msg}`;
                console.warn(msg);
                message.warning(msg, 10000);
                return null;
            }

            // 返回完整的站点信息
            return {
                mysite: res.data.mysite,
                website: res.data.website
            };
        } catch (error) {
            console.log('服务器连接失败！', error);
            message.error(`服务器连接失败！${error}`);
            return null;
        }
    };

    const testServer = async () => {
        let res = await getSite('1ptba.com')
        if (!res) {
            // message.error('服务器连接失败！');
            canSave.value = false;
            return;
        }
        message.success("服务器连接成功！");
        console.log('服务器连接成功！');
        canSave.value = true;
    }
    return {
        setting,
        canSave,
        getSetting,
        saveSetting,
        getSite,
        testServer,
        // 可选：添加计算属性方便访问单个字段
        get baseUrl() {
            return setting.value.baseUrl;
        },
        get token() {
            return setting.value.token;
        },
    };
})