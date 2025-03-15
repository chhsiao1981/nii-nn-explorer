import type {
  MetaExtractor,
  MetaItem,
  MetaItems,
  MetaNNNode,
  MetaNNParameter,
  MetaNNRecord,
  MetaNNTensor,
  MetaTaskflow,
  ProtobufInfo,
} from '../reducers/types'

export enum D3NodeType {
  None,
  MetaExtractor = 'metaExtractor',
  MetaExtractorContent = 'metaExtractorContent',
  MetaTaskflow = 'metaTaskflow',
  MetaTaskflowContent = 'metaTaskflowContent',
  MetaItems = 'metaItems',
  MetaItemsContent = 'metaItemsContent',
  MetaItem = 'metaItem',
  MetaItemContent = 'metaItemContent',
  MetaNNNode = 'metaNNNode',
  MetaNNNodeContent = 'metaNNNodeContent',
  MetaNNParameter = 'metaNNParameter',
  MetaNNParameterContent = 'metaNNParameterContent',
  MetaNNRecord = 'metaNNRecord',
  MetaNNRecordContent = 'metaNNRecordContent',
  MetaNNTensor = 'meteaNNTensor',
  MetaNNTensorContent = 'metaNNTensorContent',
}

export enum ExtractorContentType {
  TASKFLOW = 'task-flow',
  INPUT = 'inputs',
  PREPROCESS = 'preprocess',
  NODES = 'nodes',
  POSTPROCESS = 'postprocess',
  SUB_EXTRACTOR = 'sub-extractors',
  OUTPUTS = 'outputs',
}

export enum NNNodeContentType {
  INPUTS = 'inputs',
  PARAMS = 'params',
  ACTIVATION = 'activation',
  GRADIENT_INPUTS = 'gradient_inputs',
  GRADIENT_PARAMS = 'gradient_params',
  GRADIENTS = 'gradients',
  CHILDREN = 'children',
}

export interface D3Node {
  name: string
  children: D3Node[]
  theType: D3NodeType
  extractorID: string

  prefix?: string
  postfix?: string
  parent?: D3Node
  extractor?: MetaExtractor
  taskflow?: MetaTaskflow

  flowType?: TaskflowType_pb
  flowID?: number

  items?: MetaItems
  item?: MetaItem

  nnnode?: MetaNNNode
  nnparameter?: MetaNNParameter
  nnrecord?: MetaNNRecord
  tensor?: MetaNNTensor

  protobufInfo?: ProtobufInfo

  affine?: number[][]

  dataID?: string
}
