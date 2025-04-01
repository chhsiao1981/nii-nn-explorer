import type { NVImage } from '@niivue/niivue'
import type { NIIVueInfo } from '../reducers/types'

export interface BusyCount {
  count: number
}

export interface BusyState {
  busyCount: BusyCount
}

export interface NIIVueImgInfo {
  img: NVImage
  info: NIIVueInfo
}
