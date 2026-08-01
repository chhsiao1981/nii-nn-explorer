import type { TaskflowType } from "../proto/nnextractor";
import api from "./api";

import type {
  Extractor,
  MetaExtractor,
  Model,
  ProtobufResponse,
} from "./types";

export const getModelList = () =>
  api<Model[]>({
    endpoint: "/model/list",
    method: "get",
  });

export const getMetaList = () =>
  api<Extractor[]>({
    endpoint: "/meta/list",
    method: "get",
  });

export const getMeta = (metaID: string) =>
  api<MetaExtractor>({
    endpoint: `/meta/${metaID}`,
    method: "get",
  });

export const getProtobuf = (
  extractorID: string,
  flowType: TaskflowType,
  flowID: number,
  dataID: string,
) =>
  api<ProtobufResponse>({
    endpoint: "/protobuf",
    method: "post",
    json: {
      extractor_id: extractorID,
      flow_type: flowType,
      flow_id: `${flowID}`,
      data_id: dataID,
    },
  });
