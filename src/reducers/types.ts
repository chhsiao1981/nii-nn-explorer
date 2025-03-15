import type * as nnextractor_pb from '../proto/nnextractor'

export interface Model {
  name: string
  classname: string
  default_params: object
}

export interface Extractor {
  name: string
  meta: MetaExtractor
}

export interface MetaExtractor {
  name: string
  taskflow: MetaTaskflow[]
  inputs: MetaItems[]
  preprocesses: MetaItems[]
  nodes: MetaNNNode[]
  postprocesses: MetaItems[]
  outputs: MetaItems[]
  extractors: MetaExtractor[]
}

export enum TaskflowType {
  UNSPECIFIED = 'unspecified',

  INPUT = 'input',

  PREPROCESS = 'preprocess',

  FORWARD = 'forward',

  BACKWARD = 'backward',

  POSTPROCESS = 'postprocess',

  OUTPUT = 'output',

  EXTRACTOR = 'extractor',
}

export enum OpType {
  UNSPECIFIED = 'unspecified',

  UNKNOWN = 'unknown',

  OTHER = 'other',

  NONE = 'none',

  CROP = 'crop', // SAR

  PAD = 'pad', // SAR

  FLIP = 'flip', // SAR

  ORIGIN = 'origin', // RAS

  SPACING = 'spacing', // RAS

  DIRECTION = 'direction', // RAS

  AFFINE = 'affine', // RAS

  GEO_IDENTITY = 'geo_identity',
}

export enum ItemType {
  UNSPECIFIED = 'unspecified',

  /*
  I don't know the type,
  or the types are complicated and I don't want to specify the type.
  I'll just say it is a raw type.
  Let the renderer does whatever it wants.
  (Usually the renderer just presents the data as ndarray)
  */
  RAW = 'raw',

  /*
  I know the type,
  but it is not listed in the following settings.
  */
  OTHER = 'other',

  /*
  ndarray
  Usually present the ndarray as:
  * 1D: numbers
  * 2D: image
  * 3D: 3D - nii
  * > 3D: have users select 3 dimenions and present as 3D nii,
          and show the corresponding info in other dims.
  */
  NNTENSOR = 'nntensor',

  /*
  NII type (with origin, spacing, direction, affine)
  */
  NII = 'nii',

  /*
  2D-image, as ndarray
  */
  IMAGE = 'image',

  /*
  audio (can be presented as sound, or time-domain presentation), as ndarray
  */
  AUDIO = 'audio',

  /*
  spectrogram, as ndarray
  */
  SPECTROGRAM = 'spectrogram',

  /*
  text
  */
  TEXT = 'text',

  /*
  number
  */
  NUMBER = 'number',

  /*
  text or number
  */
  TEXT_NUMBER = 'text_number',

  /*
  null
  */
  NULL = 'null',

  LIST = 'list',

  MAP = 'map',

  OP_ITEM = 'op_item',
}

export enum RecordType {
  UNSPECIFIED = 'unspecified',
  ARRAY = 'array',
  LIST = 'list',
  META = 'meta',
  OP_ITEM = 'op_item',
}

export interface MetaTaskflow {
  name: string
  the_type: TaskflowType
  flow_id: number

  value?: MetaItems | MetaNNNode | MetaExtractor

  op_type: OpType
  // biome-ignore lint/suspicious/noExplicitAny: op_params can be any
  op_params: any
}

export interface MetaItems {
  name: string
  items: MetaItem[]
}

export interface MetaItem {
  name: string
  the_type: ItemType
  // biome-ignore lint/suspicious/noExplicitAny: basically value can be any in MetaItem.
  value: any
  data_id: string
}

export interface MetaOpItem {
  name: string
  op_type: OpType
  tensor: MetaNNTensor
  // biome-ignore lint/suspicious/noExplicitAny: op_params can be any type
  op_params: any
  data_id: string
}

export interface MetaNII {
  tensor: MetaNNTensor
  origin_ras: number[]
  direction_ras: number[][]
  spacing_ras: number[]
  affine_ras: number[][] | null
}

export interface MetaNNTensor {
  shape: number[]
  the_type: string
  is_meta_only?: boolean
}

export interface MetaNNNode {
  name: string
  inputs: MetaNNRecord[]
  params: MetaNNParameter[]
  activation?: MetaNNRecord | null
  gradient_inputs: MetaNNRecord[]
  gradient_params: MetaNNParameter[]
  gradients: MetaNNRecord[]
  children: MetaNNNode[] | number
}

export interface MetaNNParameter {
  name: string
  parameter: MetaNNRecord
}

export interface MetaNNRecord {
  name: string
  the_type: RecordType
  record: MetaNNTensor | MetaNNRecord[] | Record<string, MetaNNRecord>
  data_id: string
}

export type RecursiveNumber = number[] | RecursiveNumber[]

export interface NNTensor {
  shape: number[]
  array: Float32Array<ArrayBufferLike>
}

export interface NIIVueInfo {
  name: string
  flowType: nnextractor_pb.TaskflowType
  flowID: number
  dataID: string
  vol: Float32Array<ArrayBufferLike>
  spacingRAS: number[]
  originRAS: number[]
  directionRAS: number[][]
  dimsSAR: number[]
  affineRAS: number[][]
  extractorID: string

  isGeoIdentity: boolean
}

export enum ProtobufType {
  Item = 'item',
  NNRecord = 'nnrecord',
  NNParameter = 'nnparameter',
  OpItem = 'op_item',
}

export interface ProtobufResponse {
  bytes: string
  errmsg: string
}

export interface ProtobufContextInfo {
  affineRAS: number[][]
  reducedDimsSAR: boolean[]
  dimsSAR: number[]
}

export interface ProtobufInfo {
  extractorID: string
  flowType: nnextractor_pb.TaskflowType
  flowID: number
  dataID: string

  dimsSAR: number[]

  contextInfo: ProtobufContextInfo

  protobufType: ProtobufType

  isGeoIdentity?: boolean
}

export interface RefImgInfo {
  imgSizeSAR: number[]
  originRAS: number[]
  spacingRAS: number[]
  directionRAS: number[][]
  affineRAS: number[][]
  invAffineRAS: number[][]
}
