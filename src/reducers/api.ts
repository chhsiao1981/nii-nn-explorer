import config from 'config'

// biome-ignore lint/suspicious/noExplicitAny: query can be any type
export type Query = Record<string, any>

// biome-ignore lint/suspicious/noExplicitAny: params can be any type
export type Params = Record<string, any>

// biome-ignore lint/suspicious/noExplicitAny: files can be any type
export type Files = Record<string, any>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CallAPI<T> {
  endpoint: string
  method?: string
  query?: Query
  params?: Params
  isFile?: boolean
  // biome-ignore lint/suspicious/noExplicitAny: json can be any type
  json?: any
}

interface ApiParams {
  query?: Query
  method?: string
  params?: Params
  isFile?: boolean
  // biome-ignore lint/suspicious/noExplicitAny: json can be any type.
  json?: any
}

export interface ApiResult<T> {
  status: number
  data?: T
  errmsg?: string
  text?: string
  blob?: Blob
}

// biome-ignore lint/suspicious/noExplicitAny: generalized json serialization can be any type.
const serialize = (data: any): string => {
  let dataStr: string
  if (typeof data === 'object') {
    dataStr = JSON.stringify(data)
  }

  return encodeURIComponent(dataStr)
}

const queryToString = (query: Query | Params) =>
  Object.keys(query)
    .map((k) => `${serialize(k)}=${serialize(query[k])}`)
    .join('&')

const callApi = <T>(
  endpoint: string,
  { query, method = 'get', params, isFile, json }: ApiParams,
): Promise<ApiResult<T>> => {
  const { API_ROOT: CONFIG_API_ROOT } = config

  const default_api_root = window.location.origin

  const API_ROOT = CONFIG_API_ROOT || default_api_root

  let theEndpoint = endpoint
  if (!theEndpoint.includes(API_ROOT)) {
    theEndpoint = `${API_ROOT}${endpoint}`
  }

  if (query) {
    theEndpoint = `${endpoint}?${queryToString(query)}`
  }

  const headers: HeadersInit = {}
  let body: string | undefined = undefined
  if (params) {
    const paramsStr = queryToString(params)
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = paramsStr
  } else if (json) {
    body = JSON.stringify(json)
    headers['Content-Type'] = 'application/json'
  }

  const options: RequestInit = {
    method,
    headers,
    body,
  }

  if (isFile) {
    return fetchFiles(theEndpoint, options)
  }

  return fetch(theEndpoint, options)
    .then((res) => {
      const status = res.status
      return res
        .json()
        .then((data) => {
          if (res.status !== 200) {
            const msg: string = data.Msg ?? ''
            return { status, errmsg: msg }
          }

          return { status: res.status, data: data }
        })
        .catch((err) => {
          console.error('api.callApi: json: err:', err)

          return { status: 598, errmsg: err.message }
        })
    })
    .catch((err) => {
      return { status: 599, errmsg: err.message }
    })
}

const fetchFiles = <T>(theEndpoint: string, options: RequestInit): Promise<ApiResult<T>> => {
  return fetch(theEndpoint, options)
    .then((res) => {
      const status = res.status
      return res.text().then((text) => {
        return { status, text }
      })
    })
    .catch((err) => {
      return { status: 599, errmsg: err.message }
    })
}

export default <T>(callAPI: CallAPI<T>): Promise<ApiResult<T>> => {
  const { endpoint, method, query, params, isFile, json } = callAPI

  return callApi<T>(endpoint, { method, query, params, isFile, json })
}
