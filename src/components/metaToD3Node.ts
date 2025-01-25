import {
  INPUT_NAME,
  NODE_NAME,
  OUTPUT_NAME,
  POSTPROCESS_NAME,
  PREPROCESS_NAME,
  SUB_EXTRACTOR_NAME,
  TASKFLOW_NAME,
} from '../constants'

import { type D3Node, D3NodeType, NNNodeContentType } from './d3node'

import { TaskflowType as TaskflowType_pb } from '../proto/nnextractor'
import {
  ItemType,
  type MetaExtractor,
  type MetaItem,
  type MetaItems,
  type MetaNII,
  type MetaNNNode,
  type MetaNNParameter,
  type MetaNNRecord,
  type MetaNNTensor,
  type MetaOpItem,
  type MetaTaskflow,
  type OpType,
  RecordType,
  TaskflowType,
} from '../reducers/types'

import { d3SeqExtractorToD3MetaWithProtobufInfo } from './d3nodeWithProtobufInfo'

export const metaExtractorToD3Meta = (meta: MetaExtractor): D3Node => {
  const node = metaExtractorToD3MetaCore(meta)
  d3SeqExtractorToD3MetaWithProtobufInfo(node)
  return node
}

const metaExtractorToD3MetaCore = (meta: MetaExtractor, parent?: D3Node): D3Node => {
  const node: D3Node = {
    name: meta.name,
    parent: parent,
    theType: D3NodeType.MetaExtractor,
    extractor: meta,
    children: [],
    extractorID: meta.name,
  }

  const inputs = meta.inputs.map((each, flowID) =>
    metaItemsToD3Meta(each, meta.name, flowID, TaskflowType_pb.T_INPUT, node),
  )

  const preprocesses = meta.preprocesses.map((each, flowID) =>
    metaItemsToD3Meta(each, meta.name, flowID, TaskflowType_pb.T_PREPROCESS, node),
  )

  const nodes = meta.nodes.map((each) => metaNNNodeToD3Meta(each, meta.name, node))
  const postprocesses = meta.postprocesses.map((each, flowID) =>
    metaItemsToD3Meta(each, meta.name, flowID, TaskflowType_pb.T_POSTPROCESS, node),
  )
  const outputs = meta.outputs.map((each, flowID) =>
    metaItemsToD3Meta(each, meta.name, flowID, TaskflowType_pb.T_OUTPUT, node),
  )
  const extractors = meta.extractors.map((each) => metaExtractorToD3MetaCore(each, node))

  const taskflow = meta.taskflow.map((each) =>
    metaTaskflowToD3Meta(
      each,
      meta.name,
      node,
      inputs,
      preprocesses,
      nodes,
      postprocesses,
      outputs,
      extractors,
    ),
  )

  node.children = [
    {
      name: TASKFLOW_NAME,
      children: taskflow,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: INPUT_NAME,
      children: inputs,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: PREPROCESS_NAME,
      children: preprocesses,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: NODE_NAME,
      children: nodes,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: POSTPROCESS_NAME,
      children: postprocesses,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: SUB_EXTRACTOR_NAME,
      children: extractors,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
    {
      name: OUTPUT_NAME,
      children: outputs,
      theType: D3NodeType.MetaExtractorContent,
      extractorID: meta.name,
    },
  ]

  return node
}

export const metaTaskflowToD3Meta = (
  meta: MetaTaskflow,

  extractorID: string,

  parent: D3Node,
  inputs: D3Node[],
  preprocesses: D3Node[],
  nodes: D3Node[],
  postprocesses: D3Node[],
  outputs: D3Node[],
  extractors: D3Node[],
): D3Node => {
  const node: D3Node = {
    name: meta.name,
    prefix: meta.the_type,
    parent: parent,
    theType: D3NodeType.MetaTaskflow,
    taskflow: meta,
    children: [],
    extractorID,
  }

  if (meta.the_type === TaskflowType.EXTRACTOR) {
    node.children = [extractors[meta.flow_id]]
    return node
  }

  if (meta.the_type === TaskflowType.FORWARD) {
    const child = d3NNNodeToSeqD3NNNode(nodes[0], TaskflowType_pb.T_FORWARD, meta.flow_id)
    node.children = [child]
    return node
  }

  if (meta.the_type === TaskflowType.BACKWARD) {
    const child = d3NNNodeToSeqD3NNNode(nodes[0], TaskflowType_pb.T_BACKWARD, meta.flow_id)
    node.children = [child]
    return node
  }

  let theD3Node: D3Node
  if (meta.the_type === TaskflowType.INPUT) {
    theD3Node = inputs[meta.flow_id]
  } else if (meta.the_type === TaskflowType.PREPROCESS) {
    theD3Node = preprocesses[meta.flow_id]
  } else if (meta.the_type === TaskflowType.POSTPROCESS) {
    theD3Node = postprocesses[meta.flow_id]
  } else if (meta.the_type === TaskflowType.OUTPUT) {
    theD3Node = outputs[meta.flow_id]
  }

  const child = d3ItemsToSeqD3Items(theD3Node, meta.op_type, meta.op_params)
  node.children = [child]
  return node
}

const _FORWARD_ORDER_MAP = {
  inputs: 0,
  params: 1,
  children: 2,
  activation: 3,
  gradient_inputs: 4,
  gradient_params: 5,
  gradients: 6,
}

const _BACKWARD_ORDER_MAP = {
  inputs: 0,
  params: 1,
  activation: 2,
  gradient_inputs: 3,
  gradient_params: 4,
  children: 5,
  gradients: 6,
}

const d3ItemsToSeqD3Items = (
  node: D3Node,
  opType: OpType,
  // biome-ignore lint/suspicious/noExplicitAny: opParams can be any
  opParams: any,
): D3Node => {
  // name
  node.name = d3ItemsToSeqD3ItemsParseName(node, opType, opParams)

  node.children = node.children.map((each) => {
    return d3ItemToSeqD3Item(each, opType, opParams)
  })

  return node
}

const d3ItemToSeqD3Item = (
  node: D3Node,
  /* eslint-disable */
  opType: OpType,

  // biome-ignore lint/suspicious/noExplicitAny: opParams can be any type
  opParams: any,
  /* eslint-enable */
): D3Node => {
  return node
}

/* eslint-disable */
// biome-ignore lint/suspicious/noExplicitAny: opParams can be any type
const d3ItemsToSeqD3ItemsParseName = (node: D3Node, opType: OpType, opParams: any) => {
  /* eslint-enable */
  const nameList = []
  if (node.name) {
    nameList.push(node.name)
  }
  if (opType) {
    nameList.push(`(${opType})`)
  }
  return nameList.join(' ')
}

const d3NNNodeToSeqD3NNNode = (node: D3Node, flowType: TaskflowType_pb, flowID: number): D3Node => {
  // for SeqD3NNNode:
  //   NNRecords: the affine is the same, but scale with to same input size
  //   NNParameters: the affine is identity.
  const newNode: D3Node = Object.assign({}, node)
  newNode.flowType = flowType
  newNode.flowID = flowID

  newNode.children = newNode.children.map((each) => {
    return d3NNNodeContentToSeqD3NNNodeContent(each, flowType, flowID)
  })

  if (newNode.theType === D3NodeType.MetaNNNode) {
    if (flowType === TaskflowType_pb.T_FORWARD) {
      newNode.children.sort((a: D3Node, b: D3Node) => {
        // @ts-expect-error name in NNNodeContent is restricted.
        const theOrderA: number = _FORWARD_ORDER_MAP[a.name]
        // @ts-expect-error name in NNNodeContent is restricted.
        const theOrderB: number = _FORWARD_ORDER_MAP[b.name]
        return theOrderA - theOrderB
      })
    } else if (flowType === TaskflowType_pb.T_BACKWARD) {
      newNode.children.sort((a: D3Node, b: D3Node) => {
        // @ts-expect-error name in NNNodeContent is restricted.
        const theOrderA: number = _BACKWARD_ORDER_MAP[a.name]
        // @ts-expect-error name in NNNodeContent is restricted.
        const theOrderB: number = _BACKWARD_ORDER_MAP[b.name]
        return theOrderA - theOrderB
      })
    }
  }

  return newNode
}

const d3NNParameterToSeqD3NNParameter = (
  node: D3Node,
  flowType: TaskflowType_pb,
  flowID: number,
): D3Node => {
  // no need to change parameters
  const newNode = Object.assign({}, node)
  newNode.flowType = flowType
  newNode.flowID = flowID
  newNode.dataID = node.nnparameter.parameter.data_id
  return newNode
}

const d3NNNodeContentToSeqD3NNNodeContent = (
  node: D3Node,
  flowType: TaskflowType_pb,
  flowID: number,
): D3Node => {
  if (node.theType !== D3NodeType.MetaNNNodeContent) {
    console.warn('d3NNNodeContentToSeqD3NNNodeContent: not expected type: node:', node)
  }

  // no need to change node
  const newNode: D3Node = Object.assign({}, node)
  newNode.flowType = flowType
  newNode.flowID = flowID

  newNode.children = newNode.children.map((each) => {
    const name = newNode.name as NNNodeContentType
    if (name === NNNodeContentType.INPUTS) {
      return d3NNRecordToSeqD3NNRecord(each, flowType, flowID)
    }
    if (name === NNNodeContentType.PARAMS) {
      return d3NNParameterToSeqD3NNParameter(each, flowType, flowID)
    }
    if (name === NNNodeContentType.ACTIVATION) {
      return d3NNRecordToSeqD3NNRecord(each, flowType, flowID)
    }
    if (name === NNNodeContentType.GRADIENT_INPUTS) {
      return d3NNRecordToSeqD3NNRecord(each, flowType, flowID)
    }
    if (name === NNNodeContentType.GRADIENT_PARAMS) {
      return d3NNParameterToSeqD3NNParameter(each, flowType, flowID)
    }
    if (name === NNNodeContentType.GRADIENTS) {
      return d3NNRecordToSeqD3NNRecord(each, flowType, flowID)
    }
    if (name === NNNodeContentType.CHILDREN) {
      return d3NNNodeToSeqD3NNNode(each, flowType, flowID)
    }

    console.warn('d3NNNodeContentToSeqD3NNNodeContent: invalid name:', newNode.name)
    return each
  })
  return newNode
}

const d3NNRecordToSeqD3NNRecord = (
  node: D3Node,
  flowType: TaskflowType_pb,
  flowID: number,
): D3Node => {
  const newNode: D3Node = Object.assign({}, node)
  newNode.flowType = flowType
  newNode.flowID = flowID

  if (newNode.nnrecord.the_type === RecordType.LIST) {
    newNode.children = newNode.children.map((each) =>
      d3NNRecordToSeqD3NNRecord(each, flowType, flowID),
    )
  }

  return newNode
}

export const metaItemsToD3Meta = (
  meta: MetaItems,
  extractorID: string,
  flowID: number,
  flowType: TaskflowType_pb,
  parent?: D3Node,
): D3Node => {
  const node: D3Node = {
    name: meta.name,
    parent: parent,
    theType: D3NodeType.MetaItems,
    items: meta,
    children: [],
    extractorID,
    flowType: flowType,
    flowID: flowID,
  }
  node.children = meta.items.map((each) =>
    metaItemToD3Meta(each, extractorID, flowID, flowType, node),
  )
  return node
}

export const metaItemToD3Meta = (
  meta: MetaItem,
  extractorID: string,
  flowID: number,
  flowType: TaskflowType_pb,
  parent?: D3Node,
): D3Node => {
  const dataID = meta.the_type === ItemType.OP_ITEM ? meta.value.data_id : meta.data_id

  return {
    name: meta.name,
    prefix: '',
    postfix: parseMetaItemPostfix(meta),
    parent: parent,
    theType: D3NodeType.MetaItem,
    item: meta,
    children: [],
    extractorID,
    flowType: flowType,
    flowID: flowID,
    dataID,
  }
}

const parseMetaItemPostfix = (meta: MetaItem): string => {
  if (meta.the_type === ItemType.NII) {
    const value: MetaNII = meta.value
    return `${value.tensor.shape} (${value.tensor.the_type}, nii)`
  }
  if (
    meta.the_type === ItemType.NNTENSOR ||
    meta.the_type === ItemType.IMAGE ||
    meta.the_type === ItemType.AUDIO ||
    meta.the_type === ItemType.SPECTROGRAM
  ) {
    const value: MetaNNTensor = meta.value
    return `${value.shape} (${value.the_type})`
  }

  if (meta.the_type === ItemType.OP_ITEM) {
    const value: MetaOpItem = meta.value
    const tensor = value.tensor
    return `${tensor.shape} (${tensor.the_type}, ${value.op_type})`
  }

  return ''
}

export const metaNNNodeToD3Meta = (
  meta: MetaNNNode,
  extractorID: string,
  parent?: D3Node,
): D3Node => {
  const node: D3Node = {
    name: meta.name,
    prefix: '',
    parent: parent,
    theType: D3NodeType.MetaNNNode,
    nnnode: meta,
    children: [],
    extractorID,
  }

  if (meta.inputs?.length) {
    const inputs = meta.inputs.map((each) => metaNNRecordToD3Node(each, extractorID, node))
    node.children.push({
      name: NNNodeContentType.INPUTS,
      children: inputs,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }
  if (meta.params?.length) {
    const params = meta.params.map((each) => metaNNParameterToD3Node(each, extractorID, node))
    node.children.push({
      name: NNNodeContentType.PARAMS,
      children: params,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }
  if (meta.activation) {
    const activation = metaNNRecordToD3Node(meta.activation, extractorID, node)
    node.children.push({
      name: NNNodeContentType.ACTIVATION,
      children: [activation],
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }
  if (meta.gradient_inputs?.length) {
    const gradient_inputs = meta.gradient_inputs.map((each) =>
      metaNNRecordToD3Node(each, extractorID, node),
    )
    node.children.push({
      name: NNNodeContentType.GRADIENT_INPUTS,
      children: gradient_inputs,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }
  if (meta.gradient_params?.length) {
    const gradient_params = meta.gradient_params.map((each) =>
      metaNNParameterToD3Node(each, extractorID, node),
    )
    node.children.push({
      name: NNNodeContentType.GRADIENT_PARAMS,
      children: gradient_params,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }
  if (meta.gradients?.length) {
    const gradients = meta.gradients.map((each) => metaNNRecordToD3Node(each, extractorID, node))
    node.children.push({
      name: NNNodeContentType.GRADIENTS,
      children: gradients,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }

  if (meta.children?.length) {
    const children = meta.children.map((each) => metaNNNodeToD3Meta(each, extractorID, node))
    node.children.push({
      name: NNNodeContentType.CHILDREN,
      children: children,
      theType: D3NodeType.MetaNNNodeContent,
      extractorID,
    })
  }

  return node
}

export const metaNNParameterToD3Node = (
  meta: MetaNNParameter,
  extractorID: string,
  parent?: D3Node,
): D3Node => {
  return {
    name: meta.name,
    postfix: parseMetaNNParameterPostfix(meta),
    parent: parent,
    theType: D3NodeType.MetaNNParameter,
    nnparameter: meta,
    children: [],
    extractorID,
  }
}

const parseMetaNNParameterPostfix = (meta: MetaNNParameter): string => {
  return parseMetaNNRecordPostfix(meta.parameter)
}

const metaNNRecordToD3Node = (meta: MetaNNRecord, extractorID: string, parent?: D3Node): D3Node => {
  const dataID = meta.the_type === RecordType.OP_ITEM ? meta.record.data_id : meta.data_id
  const node: D3Node = {
    name: meta.name,
    postfix: parseMetaNNRecordPostfix(meta),
    parent: parent,
    theType: D3NodeType.MetaNNRecord,
    nnrecord: meta,
    children: [],
    extractorID,
    dataID,
  }

  if (meta.the_type === RecordType.LIST) {
    const record: MetaNNRecord[] = meta.record
    node.children = record.map((each) => metaNNRecordToD3Node(each, extractorID, node))
  }

  return node
}

const parseMetaNNRecordPostfix = (meta: MetaNNRecord): string => {
  if (meta.the_type === RecordType.OP_ITEM) {
    const value: MetaOpItem = meta.record
    const tensor = value.tensor
    return `${tensor.shape} (${tensor.the_type}, ${value.op_type})`
  }
  return meta.record.hasOwnProperty('shape')
    ? parseMetaNNTensorPostfix(meta.record as MetaNNTensor)
    : ''
}

const metaNNTensorToD3Node = (meta: MetaNNTensor, extractorID: string, parent?: D3Node): D3Node => {
  if (Array.isArray(meta)) {
    return metaArrayNNTensorToD3Node(meta, extractorID, parent)
  }
  return {
    name: '',
    postfix: parseMetaNNTensorPostfix(meta),
    parent: parent,
    theType: D3NodeType.MetaNNTensor,
    tensor: meta,
    children: [],
    extractorID,
  }
}

const metaArrayNNTensorToD3Node = (
  meta: MetaNNTensor[],
  extractorID: string,
  parent?: D3Node,
): D3Node => {
  const node: D3Node = {
    name: '',
    parent: parent,
    theType: D3NodeType.MetaNNTensor,
    children: [],
    extractorID,
  }

  const children = meta.map((each) => metaNNTensorToD3Node(each, extractorID, node))
  node.children = children
  return node
}

const parseMetaNNTensorPostfix = (meta: MetaNNTensor): string => {
  return `${meta.shape} (${meta.the_type})`
}
