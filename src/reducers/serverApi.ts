import type { CallAPI } from './api'

import type { TaskflowType } from '../proto/nnextractor'

import type { Model, Extractor, MetaExtractor, ProtobufResponse } from './types'

export const GetModelList = (): CallAPI<Model[]> => ({
  endpoint: '/model/list',
  method: 'get',
})

export const GetMetaList = (): CallAPI<Extractor[]> => ({
  endpoint: '/meta/list',
  method: 'get',
})

export const GetMeta = (metaID: string): CallAPI<MetaExtractor> => ({
  endpoint: `/meta/${metaID}`,
  method: 'get',
})

export const GetProtobuf = (
  extractorID: string,
  flowType: TaskflowType,
  flowID: number,
  dataID: string,
): CallAPI<ProtobufResponse> => {
  const ret = {
    endpoint: '/protobuf',
    method: 'post',
    json: {
      extractor_id: extractorID,
      flow_type: flowType,
      flow_id: `${flowID}`,
      data_id: dataID,
    },
  }

  return ret
}
