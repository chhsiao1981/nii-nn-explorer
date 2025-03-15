import type { ProtobufContextInfo } from '../reducers/types'

export const DEFAULT_AFFINE_RAS = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

export const DEFAULT_REDUCED_DIMS_RAS = [false, false, false]

export const DEFAULT_PROTOBUF_CONTEXT_INFO: ProtobufContextInfo = {
  affineRAS: DEFAULT_AFFINE_RAS,
  reducedDimsSAR: DEFAULT_REDUCED_DIMS_RAS,
}
