import Taro from '@tarojs/taro'
import { getOperatorToken } from '@/identity'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 自动附带 x-operator-token header（身份署名）
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    const injectHeaders = (header?: Record<string, string>): Record<string, string> => {
        const headers = { ...(header || {}) }
        const token = getOperatorToken()
        if (token && !headers['x-operator-token']) {
            headers['x-operator-token'] = token
        }
        return headers
    }

    export const request: typeof Taro.request = option => {
        return Taro.request({
            ...option,
            url: createUrl(option.url),
            header: injectHeaders(option.header as Record<string, string>),
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            header: injectHeaders(option.header as Record<string, string>),
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
            header: injectHeaders(option.header as Record<string, string>),
        })
    }
}
