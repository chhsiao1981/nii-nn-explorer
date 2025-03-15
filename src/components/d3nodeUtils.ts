import { TASKFLOW_NAME } from '../constants'
import { type D3Node, D3NodeType } from './d3node'

import { ItemType } from '../reducers/types'

export const d3NodeGetDefaultAssignedNode = (node: D3Node): D3Node | null => {
  if (node.theType !== D3NodeType.MetaExtractor) {
    return null
  }

  const taskFlowNodes = node.children.filter((each) => each.name === TASKFLOW_NAME)
  if (taskFlowNodes.length !== 1) {
    return null
  }

  const taskFlowList = taskFlowNodes[0].children
  for (const eachTaskFlow of taskFlowList) {
    for (const eachD3Items of eachTaskFlow.children) {
      for (const eachD3Item of eachD3Items.children) {
        if (eachD3Item.item?.the_type === ItemType.NII) {
          return eachD3Item
        }
      }
    }
  }

  return null
}
