import {
  type ClassState,
  type Dispatch,
  type Thunk,
  init as _init,
  createReducer,
  getRoot,
  type State as rState,
  setData,
} from 'react-reducer-utils'

import * as math from 'mathjs'

import * as nnextractor_pb from '../proto/nnextractor'

import api from './api'
import { STATUS_OK } from './constants'
import { isTensorType_pb } from './item'
import { bytesToNNTensor } from './nntensor'
import { GetMeta, GetMetaList, GetModelList, GetProtobuf } from './serverApi'
import {
  type Extractor,
  type MetaExtractor,
  type Model,
  type NIIVueInfo,
  type NNTensor,
  OpType,
  type ProtobufResponse,
  type ProtobufInfo,
  ProtobufType,
  type RefImgInfo,
  ItemType,
  NNTensorArrayType,
} from './types'

export const myClass = 'nn-visualizer/app'

export interface State extends rState {
  modelList: Model[]
  metaList: Extractor[]

  meta?: MetaExtractor
  errmsg?: string

  niivueInfo?: NIIVueInfo
  refImgInfo?: RefImgInfo
}

// init
export const init = (myID: string): Thunk<State> => {
  return (dispatch: Dispatch<State>, _) => {
    const defaultState: State = {
      modelList: [],
      metaList: [],
    }

    dispatch(_init({ myID, state: defaultState }))
    dispatch(getModelList(myID))
    dispatch(getMetaList(myID))
  }
}

export const cleanErrMsg = (myID: string) => {
  return (dispatch: Dispatch<State>, _) => {
    dispatch(setData(myID, { errmsg: '' }))
  }
}

const getModelList = (myID: string): Thunk<State> => {
  return async (dispatch: Dispatch<State>, _): void => {
    const { status, data, errmsg } = await api<Extractor[]>(GetModelList())
    if (status !== STATUS_OK) {
      dispatch(setData(myID, { status, errmsg: `unable to get model list: ${errmsg}` }))
      return
    }
    if (!data) {
      return
    }

    dispatch(setData(myID, { modelList: data }))
  }
}

const getMetaList = (myID: string): Thunk<State> => {
  return async (dispatch: Dispatch<State>, _): void => {
    const { status, data, errmsg } = await api<Extractor[]>(GetMetaList())
    if (status !== STATUS_OK) {
      dispatch(setData(myID, { status, errmsg: `unable to get meta list: ${errmsg}` }))
      return
    }
    if (!data) {
      return
    }

    dispatch(setData(myID, { metaList: data }))
  }
}

export const getMeta = (myID: string, metaID: string): Thunk<State> => {
  return async (dispatch: Dispatch<State>, _): void => {
    const { status, data, errmsg } = await api<MetaExtractor>(GetMeta(metaID))
    if (status !== STATUS_OK) {
      dispatch(setData(myID, { errmsg }))
      console.warn('app.getMeta: errmsg metaID:', metaID, 'errmsg:', errmsg)
    }
    if (!data) {
      return
    }

    dispatch(setData(myID, { meta: data }))
  }
}

export const getProtobuf = (
  myID: string,
  name: string,

  protobufInfo: ProtobufInfo,
): Thunk<State> => {
  const {
    extractorID,
    flowType,
    flowID,
    dataID,
    contextInfo,
    dimsSAR,
    protobufType,
    isGeoIdentity,
    isSegmentation,
  } = protobufInfo

  return async (dispatch: Dispatch<State>, getClassState: () => ClassState<State>): void => {
    const { status, data, errmsg } = await api<ProtobufResponse>(
      GetProtobuf(extractorID, flowType, flowID, dataID),
    )
    if (status !== STATUS_OK) {
      dispatch(
        setData(myID, {
          status,
          errmsg: `unable to get data: flowType: ${flowType} flowID ${flowID} dataID: ${dataID}  errmsg: ${errmsg ?? '(unknown)'}`,
        }),
      )
    }

    if (!data) {
      return
    }

    const binary = atob(data.bytes)
    // @ts-expect-error unit8array.from
    const binaryArray = Uint8Array.from(binary, (c) => c.codePointAt(0))

    let tensor: NNTensor | null = null
    if (protobufType === ProtobufType.NNRecord) {
      tensor = getProtobufProcessNNRecordTensor(binaryArray, dimsSAR)
    } else if (protobufType === ProtobufType.Item) {
      tensor = getProtobufProcessItemTensor(binaryArray, dimsSAR)
    } else if (protobufType === ProtobufType.OpItem) {
      tensor = getProtobufProcessOpItemTensor(binaryArray, dimsSAR, protobufInfo.isSegmentation)
    } else if (protobufType === ProtobufType.NNParameter) {
      tensor = getProtobufProcessNNRecordTensor(binaryArray, dimsSAR)
    }

    if (!tensor) {
      return
    }

    const [originRAS, directionRAS, spacingRAS] = inferOriginRASDirectionRASSpacingRASFromAffineRAS(
      contextInfo.affineRAS,
    )

    const niivueInfo: NIIVueInfo = {
      name,
      flowType: flowType,
      flowID: flowID,
      dataID,
      vol: tensor.array,
      dimsSAR: dimsSAR,
      affineRAS: contextInfo.affineRAS,

      originRAS: originRAS,
      spacingRAS: spacingRAS,
      directionRAS: directionRAS,

      extractorID,

      isGeoIdentity: isGeoIdentity ?? false,

      isSegmentation: isSegmentation ?? false,
    }

    const toUpdate = { niivueInfo }

    const classState = getClassState()
    const root = getRoot(classState)

    if (!root.refImgInfo) {
      const refImgInfo: RefImgInfo = {
        imgSizeSAR: dimsSAR,
        originRAS: originRAS,
        spacingRAS: spacingRAS,
        directionRAS: directionRAS,
        affineRAS: contextInfo.affineRAS,
        invAffineRAS: math.inv(contextInfo.affineRAS),
      }
      toUpdate['refImgInfo'] = refImgInfo
    }

    dispatch(setData(myID, toUpdate))
  }
}

const getProtobufProcessNNRecordTensor = (binaryArray: Uint8Array, dimsSAR: number[]) => {
  const item_pb = nnextractor_pb.NNRecord.fromBinary(binaryArray)

  const tensorBinary = item_pb.tensor?.theBytes ?? null

  return bytesToNNTensor(tensorBinary, dimsSAR)
}

const getProtobufProcessItemTensor = (binaryArray: Uint8Array, dimsSAR: number[]) => {
  const item_pb = nnextractor_pb.Item.fromBinary(binaryArray)

  if (item_pb.theType === nnextractor_pb.ItemType.I_NII && item_pb.nii) {
    const nntensorBinary = item_pb.nii.tensor?.theBytes ?? null
    return bytesToNNTensor(nntensorBinary, dimsSAR)
  }

  if (isTensorType_pb(item_pb.theType)) {
    const tensorBinary = item_pb.tensor?.theBytes ?? null
    return bytesToNNTensor(tensorBinary, dimsSAR)
  }

  return null
}

const getProtobufProcessOpItemTensor = (
  binaryArray: Uint8Array,
  dimsSAR: number[],
  isSegmentation?: boolean,
) => {
  const op_item_pb = nnextractor_pb.OpItem.fromBinary(binaryArray)

  const nntensorBinary = op_item_pb.tensor?.theBytes ?? null

  const arrayType = isSegmentation ? NNTensorArrayType.UINT8 : NNTensorArrayType.FLOAT32

  return bytesToNNTensor(nntensorBinary, dimsSAR, arrayType)
}

const inferOriginRASDirectionRASSpacingRASFromAffineRAS = (
  affineRAS: number[][],
): [number[], number[][], number[]] => {
  const origin = [affineRAS[0][3], affineRAS[1][3], affineRAS[2][3], affineRAS[3][3]]
  const [spacing0, direction0] = spacingDirection(affineRAS[0][0], affineRAS[1][0], affineRAS[2][0])
  const [spacing1, direction1] = spacingDirection(affineRAS[0][1], affineRAS[1][1], affineRAS[2][1])
  const [spacing2, direction2] = spacingDirection(affineRAS[0][2], affineRAS[1][2], affineRAS[2][2])

  const spacing = [spacing0, spacing1, spacing2]
  const direction = [
    [direction0[0], direction1[0], direction2[0]],
    [direction0[1], direction1[1], direction2[1]],
    [direction0[2], direction1[2], direction2[2]],
  ]

  return [origin, direction, spacing]
}

const spacingDirection = (dir0: number, dir1: number, dir2: number): [number, number[]] => {
  const spacing = Math.sqrt(dir0 * dir0 + dir1 * dir1 + dir2 * dir2)
  return [spacing, [dir0 / spacing, dir1 / spacing, dir2 / spacing]]
}
export default createReducer<State>()
