import Taro from '@tarojs/taro'
import { OPERATOR_TOKEN_KEY, PROJECT_CODE_KEY } from '@/identity'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    const withIdentityHeader = (option: any) => {
        const token = Taro.getStorageSync(OPERATOR_TOKEN_KEY)
        const projectCode = Taro.getStorageSync(PROJECT_CODE_KEY)
        return {
            ...option,
            header: {
                ...(option.header || {}),
                ...(token ? { 'x-operator-token': token } : {}),
                ...(projectCode ? { 'x-project-code': projectCode } : {}),
            },
        }
    }

    export const request: typeof Taro.request = option => {
        return Taro.request(withIdentityHeader({
            ...option,
            url: createUrl(option.url),
        }))
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile(withIdentityHeader({
            ...option,
            url: createUrl(option.url),
        }))
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile(withIdentityHeader({
            ...option,
            url: createUrl(option.url),
        }))
    }
}
