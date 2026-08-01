import { ItemType as ItemType_pb } from '../proto/nnextractor'
import { ItemType } from './types'

export const ITEM_TENSOR_TYPE_SET_pb = new Set<ItemType_pb>([
  ItemType_pb.I_NNTENSOR,
  ItemType_pb.I_IMAGE,
  ItemType_pb.I_AUDIO,
  ItemType_pb.I_SPECTROGRAM,
])

export const ITEM_TENSOR_TYPE_SET = new Set<ItemType>([
  ItemType.NNTENSOR,
  ItemType.IMAGE,
  ItemType.AUDIO,
  ItemType.SPECTROGRAM,
])

export const ITEM_SKIP_SAVE_FILE_TYPE_SET_pb = new Set<ItemType_pb>([
  ItemType_pb.I_UNSPECIFIED,
  ItemType_pb.I_RAW,
  ItemType_pb.I_OTHER,
  ItemType_pb.I_TEXT,
  ItemType_pb.I_NUMBER,
  ItemType_pb.I_TEXT_NUMBER,
  ItemType_pb.I_NULL,

  ItemType_pb.I_LIST,
  ItemType_pb.I_MAP,
])

export const ITEM_SKIP_SAVE_FILE_TYPE_SET = new Set<ItemType>([
  ItemType.UNSPECIFIED,
  ItemType.RAW,
  ItemType.OTHER,
  ItemType.TEXT,
  ItemType.NUMBER,
  ItemType.TEXT_NUMBER,
  ItemType.NULL,

  ItemType.LIST,
  ItemType.MAP,
])

export const isTensorType_pb = (itemType: ItemType_pb) => {
  return ITEM_TENSOR_TYPE_SET_pb.has(itemType)
}

export const isSkipSaveFileType_pb = (itemType: ItemType_pb) => {
  return ITEM_SKIP_SAVE_FILE_TYPE_SET_pb.has(itemType)
}

export const isTensorType = (itemType: ItemType) => {
  return ITEM_TENSOR_TYPE_SET.has(itemType)
}

export const isSkipSaveFileType = (itemType: ItemType) => {
  return ITEM_SKIP_SAVE_FILE_TYPE_SET.has(itemType)
}
