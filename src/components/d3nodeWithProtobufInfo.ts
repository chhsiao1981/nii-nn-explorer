import {
  ItemType,
  OpType,
  type ProtobufContextInfo,
  ProtobufType,
  TaskflowType,
  type MetaOpItem,
  type MetaNNTensor,
} from '../reducers/types'
import {
  DEFAULT_AFFINE_RAS,
  DEFAULT_PROTOBUF_CONTEXT_INFO,
  DEFAULT_REDUCED_DIMS_RAS as DEFAULT_REDUCED_DIMS_SAR,
} from './constants'
import { ExtractorContentType, NNNodeContentType, type D3Node } from './d3node'

import { isTensorType, ITEM_SKIP_SAVE_FILE_TYPE_SET } from '../reducers/item'

import { matMul } from '../utils'

import { RecordType } from '../reducers/types'

export const d3SeqExtractorToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo?: ProtobufContextInfo,
): ProtobufContextInfo => {
  const taskflowNode = d3SeqExtractorToD3MetaWithProtobufInfoGetTaskflowNode(node)
  if (!taskflowNode) {
    return currentContextInfo
  }

  let newContextInfo = currentContextInfo ?? DEFAULT_PROTOBUF_CONTEXT_INFO
  taskflowNode.children.map((each) => {
    if (each.taskflow.the_type === TaskflowType.EXTRACTOR) {
      newContextInfo = d3ExtractorsToD3MetaWithProtobufInfo(each, newContextInfo)
      return
    }
    if (each.taskflow.the_type === TaskflowType.FORWARD) {
      newContextInfo = d3SeqNNNodeListToD3MetaWithProtobufInfo(each, newContextInfo)
      return
    }
    if (each.taskflow.the_type === TaskflowType.BACKWARD) {
      newContextInfo = d3SeqNNNodeListToD3MetaWithProtobufInfo(each, newContextInfo)
      return
    }
    newContextInfo = d3SeqItemsListToD3MetaWithProtobufInfo(each, newContextInfo)
  })

  return newContextInfo
}

const d3ExtractorsToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  let newContextInfo = currentContextInfo
  node.children.map((each) => {
    newContextInfo = d3SeqExtractorToD3MetaWithProtobufInfo(each, newContextInfo)
  })
  return newContextInfo
}

const d3SeqExtractorToD3MetaWithProtobufInfoGetTaskflowNode = (node: D3Node): D3Node | null => {
  const taskflowNodeList = node.children.filter(
    (each) => each.name === ExtractorContentType.TASKFLOW,
  )
  if (!taskflowNodeList.length) {
    console.warn(
      'd3ExtractorToD3MetaWithProtobufInfo: no taskflow: node.name:',
      node.name,
      'node.children:',
      node.children,
    )
    return null
  }
  if (taskflowNodeList.length > 1) {
    console.warn('d3ExtractorToD3MetaWithProtobufInfo: taskflow > 1')
  }
  return taskflowNodeList[0]
}

const d3SeqNNNodeListToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  node.children.map((each) => {
    d3SeqNNNodeToD3MetaWithProtobufInfo(each, currentContextInfo)
  })
  return currentContextInfo
}

const d3SeqNNNodeToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  node.children.map((each) => {
    d3SeqNNNodeContentToD3MetaWithProtobufInfo(each, currentContextInfo)
  })
  return currentContextInfo
}

const d3SeqNNNodeContentToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  node.children.map((each) => {
    if (node.name === NNNodeContentType.INPUTS) {
      d3SeqNNRecordToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.PARAMS) {
      d3SeqNNParameterToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.ACTIVATION) {
      d3SeqNNRecordToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.GRADIENT_INPUTS) {
      d3SeqNNRecordToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.GRADIENT_PARAMS) {
      d3SeqNNParameterToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.GRADIENTS) {
      d3SeqNNRecordToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
    if (node.name === NNNodeContentType.CHILDREN) {
      d3SeqNNNodeToD3MetaWithProtobufInfo(each, currentContextInfo)
      return
    }
  })

  return currentContextInfo
}

const d3SeqNNRecordToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  if (node.nnrecord.the_type === RecordType.LIST) {
    node.children.map((each) => {
      d3SeqNNRecordToD3MetaWithProtobufInfo(each, currentContextInfo)
    })
    return
  }

  const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
    node.nnrecord.record.tensor.shape,
    currentContextInfo.reducedDimsSAR,
  )

  const currentDimsSAR = currentContextInfo.dimsSAR
  const spacingR = currentDimsSAR[currentDimsSAR.length - 1] / dimsSAR[dimsSAR.length - 1]
  const spacingA = currentDimsSAR[currentDimsSAR.length - 2] / dimsSAR[dimsSAR.length - 2]
  const spacingS = currentDimsSAR[currentDimsSAR.length - 3] / dimsSAR[dimsSAR.length - 3]
  const newAffineRAS = [
    [spacingR, 0, 0, 0],
    [0, spacingA, 0, 0],
    [0, 0, spacingS, 0],
    [0, 0, 0, 1],
  ]

  const affineRAS = matMul(currentContextInfo.affineRAS, newAffineRAS)

  const newContextInfo: ProtobufContextInfo = {
    affineRAS: affineRAS,
    reducedDimsSAR: currentContextInfo.reducedDimsSAR,
    dimsSAR: dimsSAR,
  }

  node.protobufInfo = {
    extractorID: node.extractorID,
    flowType: node.flowType,
    flowID: node.flowID,

    dataID: node.dataID,

    dimsSAR: dimsSAR,

    contextInfo: newContextInfo,

    protobufType: ProtobufType.NNRecord,
  }

  return currentContextInfo
}

const d3SeqNNParameterToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  // XXX assume that the parameter is always array
  const [dimsSAR, reducedDimsSAR] = d3SeqNNParameterDimsSAR(node.nnparameter.parameter.record.shape)
  const affineRAS = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]

  const newContextInfo: ProtobufContextInfo = {
    affineRAS,
    reducedDimsSAR: reducedDimsSAR,
    dimsSAR: dimsSAR,
  }

  node.protobufInfo = {
    extractorID: node.extractorID,
    flowType: node.flowType,
    flowID: node.flowID,

    dataID: node.dataID,

    dimsSAR: dimsSAR,

    contextInfo: newContextInfo,

    protobufType: ProtobufType.NNRecord,

    isGeoIdentity: true,
  }

  return currentContextInfo
}

const d3SeqNNParameterDimsSAR = (shape: number[]) => {
  if (shape.length === 1) {
    const newShape = [1, 1].concat(shape)
    return [newShape, [true, true, false]]
  }
  if (shape.length === 2) {
    const newShape = [1].concat(shape)
    return [newShape, [true, false, false]]
  }

  return [shape, [false, false, false]]
}

const d3SeqItemsListToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  let newContextInfo = currentContextInfo
  node.children.map((each) => {
    newContextInfo = d3SeqItemsToD3MetaWithProtobufInfo(each, newContextInfo)
  })
  return newContextInfo
}
const d3SeqItemsToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo => {
  let newContextInfo = currentContextInfo
  let isUpdatedContextInfo = false
  node.children.map((each) => {
    ;[newContextInfo, isUpdatedContextInfo] = d3SeqItemToD3MetaWithProtobufInfo(
      each,
      newContextInfo,
      isUpdatedContextInfo,
    )
  })
  return newContextInfo
}

const d3SeqItemToD3MetaWithProtobufInfo = (
  node: D3Node,
  currentContextInfo: ProtobufContextInfo,
  isUpdatedContextInfo: boolean,
): [ProtobufContextInfo, bool] => {
  if (ITEM_SKIP_SAVE_FILE_TYPE_SET.has(node.item.the_type)) {
    return [currentContextInfo, isUpdatedContextInfo]
  }

  if (node.item.the_type === ItemType.NII) {
    // assuming NII as always 3D or more dimensions.
    const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
      node.item.value.tensor.shape,
      DEFAULT_REDUCED_DIMS_SAR,
    )
    const newContextInfo: ProtobufContextInfo = {
      affineRAS: node.item.value.affine_ras,
      reducedDimsSAR: DEFAULT_REDUCED_DIMS_SAR,
      dimsSAR: dimsSAR,
    }
    node.protobufInfo = {
      extractorID: node.extractorID,
      flowType: node.flowType,
      flowID: node.flowID,

      dataID: node.dataID,

      dimsSAR: dimsSAR,

      contextInfo: newContextInfo,

      protobufType: ProtobufType.Item,
    }

    return [node.protobufInfo.contextInfo, true]
  }

  if (isTensorType(node.item.the_type)) {
    const tensor = node.item.value as MetaNNTensor

    const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
      tensor.shape,
      currentContextInfo.reducedDimsSAR,
    )

    const contextInfo: ProtobufContextInfo = {
      affineRAS: currentContextInfo.affineRAS,
      reducedDimsSAR: currentContextInfo.reducedDimsSAR,
      dimsSAR: dimsSAR,
    }

    node.protobufInfo = {
      extractorID: node.extractorID,
      flowType: node.flowType,
      flowID: node.flowID,

      dataID: node.dataID,
      dimsSAR: dimsSAR,
      contextInfo: contextInfo,

      protobufType: ProtobufType.Item,
    }

    return [node.protobufInfo.contextInfo, isUpdatedContextInfo]
  }

  if (node.item.the_type === ItemType.OP_ITEM) {
    if (isUpdatedContextInfo) {
      const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
        node.item.value.tensor.shape,
        currentContextInfo.reducedDimsSAR,
      )

      const contextInfo: ProtobufContextInfo = {
        affineRAS: currentContextInfo.affineRAS,
        reducedDimsSAR: currentContextInfo.reducedDimsSAR,
        dimsSAR: dimsSAR,
      }

      node.protobufInfo = {
        extractorID: node.extractorID,
        flowType: node.flowType,
        flowID: node.flowID,

        dataID: node.dataID,
        contextInfo: contextInfo,
        dimsSAR: dimsSAR,

        protobufType: ProtobufType.OpItem,
      }

      return [currentContextInfo, true]
    }

    const contextInfo = d3SeqOpItemToD3MetaWithProtobufInfoGetContextInfo(
      node.item.value,
      currentContextInfo,
    )
    if (!contextInfo) {
      return [currentContextInfo, false]
    }

    // contextInfo.affineRAS first to map back to ref coordinate.
    // and then map back to world coordinate.
    const affineRAS = matMul(currentContextInfo.affineRAS, contextInfo.affineRAS)

    const newContextInfo: ProtobufContextInfo = {
      affineRAS: affineRAS,
      reducedDimsSAR: contextInfo.reducedDimsSAR,
      dimsSAR: contextInfo.dimsSAR,
    }
    node.protobufInfo = {
      extractorID: node.extractorID,
      flowType: node.flowType,
      flowID: node.flowID,

      dataID: node.dataID,

      contextInfo: newContextInfo,
      dimsSAR: newContextInfo.dimsSAR,

      protobufType: ProtobufType.OpItem,
    }

    return [node.protobufInfo.contextInfo, true]
  }

  return [currentContextInfo, isUpdatedContextInfo]
}

const d3SeqOpItemToD3MetaWithProtobufInfoGetContextInfo = (
  opItem: MetaOpItem,
  currentContextInfo: ProtobufContextInfo,
): ProtobufContextInfo | null => {
  const opParams = opItem.op_params
  if (opItem.op_type === OpType.CROP) {
    const [offsetS, isReduceS] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffineCropGetOffset(
      opParams[opParams.length - 3],
      currentContextInfo.reducedDimsSAR[0],
    )
    const [offsetA, isReduceA] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffineCropGetOffset(
      opParams[opParams.length - 2],
      currentContextInfo.reducedDimsSAR[1],
    )
    const [offsetR, isReduceR] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffineCropGetOffset(
      opParams[opParams.length - 1],
      currentContextInfo.reducedDimsSAR[2],
    )

    const newAffineRAS = [
      [1, 0, 0, offsetR],
      [0, 1, 0, offsetA],
      [0, 0, 1, offsetS],
      [0, 0, 0, 1],
    ]
    const reducedDimsSAR = [isReduceS, isReduceA, isReduceR]
    const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(opItem.tensor.shape, reducedDimsSAR)
    return { affineRAS: newAffineRAS, reducedDimsSAR: reducedDimsSAR, dimsSAR: dimsSAR }
  }

  if (opItem.op_type === OpType.PAD) {
    const [offsetS, isReduceS] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffinePadGetOffset(
      opParams[opParams.length - 3],
      currentContextInfo.reducedDimsSAR[0],
    )
    const [offsetA, isReduceA] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffinePadGetOffset(
      opParams[opParams.length - 2],
      currentContextInfo.reducedDimsSAR[1],
    )
    const [offsetR, isReduceR] = d3SeqOpItemToD3MetaWithProtobufInfoGetAffinePadGetOffset(
      opParams[opParams.length - 1],
      currentContextInfo.reducedDimsSAR[2],
    )

    const newAffineRAS = [
      [1, 0, 0, -offsetR],
      [0, 1, 0, -offsetA],
      [0, 0, 1, -offsetS],
      [0, 0, 0, 1],
    ]
    const reducedDimsSAR = [isReduceS, isReduceA, isReduceR]
    const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(opItem.tensor.shape, reducedDimsSAR)
    return { affineRAS: newAffineRAS, reducedDimsSAR: reducedDimsSAR, dimsSAR: dimsSAR }
  }

  if (opItem.op_type === OpType.SPACING) {
    const newSpacingR = opParams[opParams.length - 3]
    const newSpacingA = opParams[opParams.length - 2]
    const newSpacingS = opParams[opParams.length - 1]
    const [origSpacing, _] = affineRAStoSpacingDirectionRAS(currentContextInfo.affineRAS)
    const origSpacingR = origSpacing[0]
    const origSpacingA = origSpacing[1]
    const origspacingS = origSpacing[2]
    const newAffineRAS = [
      [newSpacingR / origSpacingR, 0, 0, 0],
      [0, newSpacingA / origSpacingA, 0, 0],
      [0, 0, newSpacingS / origspacingS, 0],
      [0, 0, 0, 1],
    ]

    const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
      opItem.tensor.shape,
      currentContextInfo.reducedDimsSAR,
    )

    return { affineRAS: newAffineRAS, reducedDimsSAR: currentContextInfo.reducedDimsSAR, dimsSAR }
  }

  const dimsSAR = d3SeqToD3WithProtobufInfoIntegrateDimsSAR(
    opItem.tensor.shape,
    currentContextInfo.reducedDimsSAR,
  )
  return {
    affineRAS: DEFAULT_AFFINE_RAS,
    reducedDimsSAR: currentContextInfo.reducedDimsSAR,
    dimsSAR,
  }
}

const affineRAStoSpacingDirectionRAS = (affineRAS: number[][]): [number[], number[][]] => {
  const spacingR = Math.sqrt(
    affineRAS[0][0] * affineRAS[0][0] +
      affineRAS[0][1] * affineRAS[0][1] +
      affineRAS[0][2] * affineRAS[0][2],
  )

  const spacingA = Math.sqrt(
    affineRAS[1][0] * affineRAS[1][0] +
      affineRAS[1][1] * affineRAS[1][1] +
      affineRAS[1][2] * affineRAS[1][2],
  )

  const spacingS = Math.sqrt(
    affineRAS[2][0] * affineRAS[2][0] +
      affineRAS[2][1] * affineRAS[2][1] +
      affineRAS[2][2] * affineRAS[2][2],
  )

  const direction = [
    [affineRAS[0][0] / spacingR, affineRAS[0][1] / spacingR, affineRAS[0][2] / spacingR, 0],
    [affineRAS[1][0] / spacingA, affineRAS[1][1] / spacingA, affineRAS[1][2] / spacingA, 0],
    [affineRAS[2][0] / spacingS, affineRAS[2][1] / spacingS, affineRAS[2][2] / spacingS, 0],
    [0, 0, 0, 1],
  ]

  return [[spacingR, spacingA, spacingS], direction]
}

const d3SeqOpItemToD3MetaWithProtobufInfoGetAffineCropGetOffset = (
  cropOffset: number | [number | null],
  currentReducedDimsSAR: boolean,
) => {
  if (!Array.isArray(cropOffset)) {
    return [cropOffset, true]
  }

  return [cropOffset[0], currentReducedDimsSAR]
}

const d3SeqOpItemToD3MetaWithProtobufInfoGetAffinePadGetOffset = (
  cropOffset: number | [number | null],
  currentReducedDimsSAR: boolean,
) => {
  if (!Array.isArray(cropOffset)) {
    return [cropOffset, false]
  }

  return [cropOffset[0], currentReducedDimsSAR]
}

const d3SeqToD3WithProtobufInfoIntegrateDimsSAR = (
  shape: number[],
  reducerdDimsSAR: number[],
): number[] => {
  let newShape = shape.map((each) => each)
  for (let idx = 2; idx >= 0; idx--) {
    const shapeIdx = shape.length + idx - 2
    if (reducerdDimsSAR[idx]) {
      const prefix = shapeIdx < 0 ? [] : newShape.slice(0, shapeIdx)
      const postfix = shapeIdx < 0 ? [] : newShape.slice(shapeIdx)
      newShape = prefix.concat([1]).concat(postfix)
    }
  }
  return newShape
}
