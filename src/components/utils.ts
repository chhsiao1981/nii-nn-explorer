import { useState } from 'react'

import { NVImage, type Niivue } from '@niivue/niivue/packages/niivue/src/niivue'
import type { vec3 } from 'gl-matrix'
import { NIFTI2 } from 'nifti-reader-js'
import { genUUID } from 'react-reducer-utils'
import type { NIIVueInfo } from '../reducers/types'
import type { BusyState } from './types'

export const useBusyState = (): [BusyState, () => void, () => void] => {
  const [busyState, setBusyState] = useState<BusyState>({ busyCount: { count: 0 } })

  const incBusyState = () => {
    busyState.busyCount.count++
    setBusyState({ busyCount: busyState.busyCount })
  }

  const decBusyState = () => {
    busyState.busyCount.count--
    setBusyState({ busyCount: busyState.busyCount })
  }

  return [busyState, incBusyState, decBusyState]
}

export const niivueInfoToNVImage = (niivueInfo: NIIVueInfo): NVImage => {
  // https://github.com/niivue/niivue/blob/main/packages/niivue/src/nvimage/index.ts#L3807
  const img = new NVImage()
  img.name = niivueInfo.name
  img.id = genUUID()

  if (!niivueInfo.affineRAS || niivueInfo.affineRAS.length === 0) {
    niivueInfo.affineRAS = inferAffineRASFromOriginRASDirectionRASSpacingRAS(
      niivueInfo.originRAS,
      niivueInfo.directionRAS,
      niivueInfo.spacingRAS,
    )
  }

  const hdr = new NIFTI2()
  hdr.littleEndian = true
  hdr.dim_info = 0
  hdr.intent_p1 = 0
  hdr.intent_p2 = 0
  hdr.intent_p3 = 0
  hdr.intent_code = 0
  hdr.datatypeCode = 16
  hdr.numBitsPerVoxel = 32
  hdr.slice_start = 0
  hdr.slice_end = 0
  hdr.slice_code = 0

  // For this setup, this is about scaling of pixel dimensions.
  // niivue allows for only at most 4D data, as [channel, R, A, S].
  hdr.pixDims = [1, niivueInfo.spacingRAS[0], niivueInfo.spacingRAS[1], niivueInfo.spacingRAS[2]]
  hdr.vox_offset = 352
  hdr.scl_slope = 0
  hdr.scl_inter = 0
  hdr.xyzt_units = 10
  hdr.cal_max = 0
  hdr.cal_min = 0
  hdr.slice_duration = 0
  hdr.toffset = 0
  hdr.description = ''
  hdr.aux_file = ''
  hdr.intent_name = ''
  hdr.qform_code = 2
  hdr.sform_code = 2
  hdr.quatern_b = 0
  hdr.quatern_c = 0
  hdr.quatern_d = 0
  hdr.qoffset_x = 0
  hdr.qoffset_y = 0
  hdr.qoffset_z = 0
  hdr.magic = 'n+1'
  hdr.extensionFlag = [0, 0, 0, 0]
  hdr.extensions = []
  hdr.extensionSize = 0
  hdr.extensionCode = 0

  // For this setup, dims of data from SimpleITK is stored as SAR
  // we want the hdr.dims as [channel, R, A, S]

  const dims = niivueInfo.dimsSAR
  const n4DChannels = dims.length < 3 ? 0 : dims.length - 3
  const n4Ddims = dims.slice(0, n4DChannels).reduce((r, x) => {
    return r * x
  }, 1)

  const the3DDims = dims.slice(n4DChannels)
  hdr.dims = [n4Ddims, the3DDims[2], the3DDims[1], the3DDims[0]]
  hdr.affine = niivueInfo.affineRAS

  img.hdr = hdr

  // The img layout from nifti-reader-js is the same as SimpleITK (channel, S, A, R)
  img.img = niivueInfo.vol
  img.imageType = 1
  img.dims = hdr.dims
  img.frame4D = 0
  img.nFrame4D = n4Ddims

  const nVox3D = niivueInfo.dimsSAR.slice(n4DChannels).reduce((r, x) => {
    return r * x
  }, 1)

  img.nVox3D = nVox3D

  img.calculateRAS()
  img.calMinMax(0)

  return img
}

export const niivueInfoDimsToDisplayDims = (dims: number[]) => {
  const n4DChannels = dims.length < 3 ? 0 : dims.length - 3
  const dims4D = dims.slice(0, n4DChannels)
  const dims3D = dims.slice(n4DChannels).reverse()

  return dims4D.concat(dims3D)
}

export const inferAffineRASFromOriginRASDirectionRASSpacingRAS = (
  originRAS: number[],
  directionRAS: number[][],
  spacingRAS: number[],
): number[][] => {
  // For this setup, we want to have the affine as RAS based. direction / origin / spacing from SimpleITK is LPS based."
  return [
    [directionRAS[0][0] * spacingRAS[0], directionRAS[0][1], directionRAS[0][2], originRAS[0]],
    [directionRAS[1][0], directionRAS[1][1] * spacingRAS[1], directionRAS[1][2], originRAS[1]],
    [directionRAS[2][0], directionRAS[2][1], directionRAS[2][2] * spacingRAS[2], originRAS[2]],
    [0, 0, 0, 1],
  ]
}

export const getVoxelValue = (nv: Niivue, vox: vec3): number => {
  // location: R A S
  // dims: C R A S
  // voxel: S A R
  if (!nv.back?.dims) {
    console.warn('getVoxelValue: nv.back.dims is null: nv:', nv)
    return 0
  }

  const theImg = nv.overlays.length ? nv.overlays[0] : nv.back
  return theImg.getValue(vox[0], vox[1], vox[2], theImg.frame4D)
}

export const getFracFromVox = (nv: Niivue, vox: vec3): vec3 => {
  if (!nv.back?.dims) {
    console.warn('getVoxelValue: nv.back.dims is null: nv:', nv)
    return 0
  }

  const theImg = nv.overlays.length ? nv.overlays[0] : nv.back
  const ret = theImg.convertVox2Frac(vox)
  if (theImg.dimsRAS[theImg.dimsRAS.length - 3] === 1) {
    ret[0] = 0
  }
  if (theImg.dimsRAS[theImg.dimsRAS.length - 2] === 1) {
    ret[1] = 0
  }
  if (theImg.dimsRAS[theImg.dimsRAS.length - 1] === 1) {
    ret[2] = 0
  }

  return ret
}

export const getVoxFromFrac = (nv: Niivue, frac: vec3): vec3 => {
  if (!nv.back?.dims) {
    console.warn('getVoxelValue: nv.back.dims is null: nv:', nv)
    return 0
  }

  const theImg = nv.overlays.length ? nv.overlays[0] : nv.back
  return theImg.convertFrac2Vox(frac)
}

// biome-ignore lint/suspicious/noExplicitAny: params can be any type.
export const deepCopy = (params: any) => {
  if (Array.isArray(params)) {
    return params.map((each) => deepCopy(each))
  }
  if (isObject(params)) {
    return Object.keys(params).reduce((r, key) => {
      r[key] = deepCopy(params[key])
      return r
    }, {})
  }
  return params
}

// biome-ignore lint/suspicious/noExplicitAny: obj can by any type.
export const isObject = (obj: any): boolean => {
  return obj && obj.constructor.name === 'Object'
}
