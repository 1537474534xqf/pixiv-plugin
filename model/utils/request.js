import axios from 'axios'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Config } from '#components'

const config = Config.getDefOrConfig('config')

class HttpClient {
  /**
   * 构造函数，初始化代理、cookie 和默认请求头
   * @param {string} proxy - 代理地址（可以是 http、https 或 socks 类型）
   * @param {string} cookie - 请求使用的 Cookie
   */
  constructor (proxy, cookie) {
    this.proxy = proxy
    this.cookie = cookie
    this.defaultHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
      'Content-Type': 'application/json',
      Cookie: cookie
    }
    this.agent = this.createAgent(proxy)
  }

  createAgent (proxy) {
    if (!proxy) return null
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
      return new HttpsProxyAgent(proxy)
    } else if (proxy.startsWith('socks')) {
      return new SocksProxyAgent(proxy)
    } else {
      throw new Error('代理类型既不是http也不是socks')
    }
  }

  /**
   * 发起 HTTP 请求
   * @param {Object} options - 请求选项
   * @param {string} options.method - 请求方法（GET 或 POST）
   * @param {string} options.url - 请求的 URL
   * @param {Object} options.data - 请求的数据（仅适用于 POST 方法）
   * @param {Object} options.headers - 请求头
   * @returns {Promise<Object>} 请求的响应数据
   * @throws {Error} 如果请求失败，抛出错误
   */
  async request ({ method = 'GET', url, data = null, headers = {} }) {
    try {
      const axiosInstance = axios.create({
        httpsAgent: this.agent ? this.agent : null,
        httpAgent: this.agent ? this.agent : null,
        timeout: 10000
      })
      const combinedHeaders = { ...this.defaultHeaders, ...headers }

      const requestConfig = {
        method,
        url,
        headers: combinedHeaders
      }

      if (method.toUpperCase() === 'POST' && data) {
        requestConfig.data = data
      }

      const response = await axiosInstance(requestConfig)
      return response.data
    } catch (error) {
      logger.error('请求失败:', error.message)
      if (error.response) {
        logger.error('响应状态:', error.response.status)
        logger.error('响应数据:', error.response.data)
      }
      throw error
    }
  }
}

const proxy = config.proxy
const cookie = config.cookie
if (!cookie) {
  throw new Error('Cookie都没有配置,你玩你妈呢')
}
const Request = new HttpClient(proxy, cookie)

export default Request
