import * as math from "mathjs";
import type { State as rState, Thunk } from "use-thunk";

import * as nnextractor_pb from "../proto/nnextractor";

import { STATUS_OK } from "./constants";
import { isTensorType_pb } from "./item";
import { bytesToNNTensor } from "./nntensor";
import {
  getMeta as APIGetMeta,
  getMetaList as APIGetMetaList,
  getModelList as APIGetModelList,
  getProtobuf as APIGetProtobuf,
} from "./serverApi";
import {
  type Extractor,
  NNTensorArrayType,
  type ProtobufInfo,
  ProtobufType,
  type RefImgInfo,
} from "./types";

export const name = "nii-nn-explorer/app";

export interface State extends rState {
  modelList: Model[];
  metaList: Extractor[];

  meta?: MetaExtractor;
  errmsg: string;

  niivueInfo?: NIIVueInfo;
  refImgInfo?: RefImgInfo;
}

export const defaultState: State = {
  modelList: [],
  metaList: [],
  errmsg: "",
};

// init
export const init = (): Thunk<State> => {
  return (set) => {
    set(getModelList());
    set(getMetaList());
  };
};

export const cleanErrMsg = (): Thunk<State> => {
  return (set) => {
    set(null, { errmsg: "" });
  };
};

const getModelList = (): Thunk<State> => {
  return async (set) => {
    const { status, data, errmsg } = await APIGetModelList();
    if (status !== STATUS_OK) {
      set(null, { status, errmsg: `unable to get model list: ${errmsg}` });
      return;
    }
    if (!data) {
      return;
    }

    set(null, { modelList: data });
  };
};

const getMetaList = (): Thunk<State> => {
  return async (set) => {
    const { status, data, errmsg } = await APIGetMetaList();
    if (status !== STATUS_OK) {
      set(null, { status, errmsg: `unable to get meta list: ${errmsg}` });
      return;
    }
    if (!data) {
      return;
    }

    set(null, { metaList: data });
  };
};

export const getMeta = (metaID: string): Thunk<State> => {
  return async (set) => {
    const { status, data, errmsg } = await APIGetMeta(metaID);
    if (status !== STATUS_OK) {
      set(null, { errmsg });
    }
    if (!data) {
      return;
    }

    set(null, { meta: data });
  };
};

export const getProtobuf = (
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
  } = protobufInfo;

  return async (set, get) => {
    const { status, data, errmsg } = await APIGetProtobuf(
      extractorID,
      flowType,
      flowID,
      dataID,
    );
    if (status !== STATUS_OK) {
      set(null, {
        status,
        errmsg: `unable to get data: flowType: ${flowType} flowID ${flowID} dataID: ${dataID}  errmsg: ${errmsg ?? "(unknown)"}`,
      });
    }

    if (!data) {
      return;
    }

    const binary = atob(data.bytes);
    // @ts-expect-error unit8array.from
    const binaryArray = Uint8Array.from(binary, (c) => c.codePointAt(0));

    let tensor: NNTensor | null = null;
    if (protobufType === ProtobufType.NNRecord) {
      tensor = getProtobufProcessNNRecordTensor(binaryArray, dimsSAR);
    } else if (protobufType === ProtobufType.Item) {
      tensor = getProtobufProcessItemTensor(binaryArray, dimsSAR);
    } else if (protobufType === ProtobufType.OpItem) {
      tensor = getProtobufProcessOpItemTensor(
        binaryArray,
        dimsSAR,
        protobufInfo.isSegmentation,
      );
    } else if (protobufType === ProtobufType.NNParameter) {
      tensor = getProtobufProcessNNRecordTensor(binaryArray, dimsSAR);
    }

    if (!tensor) {
      return;
    }

    const [originRAS, directionRAS, spacingRAS] =
      inferOriginRASDirectionRASSpacingRASFromAffineRAS(contextInfo.affineRAS);

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
    };

    const toUpdate: Partial<State> = { niivueInfo };

    const root = get();

    // XXX input image is always the first protobuf.
    if (!root.refImgInfo) {
      toUpdate.refImgInfo = {
        imgSizeSAR: dimsSAR,
        originRAS: originRAS,
        spacingRAS: spacingRAS,
        directionRAS: directionRAS,
        affineRAS: contextInfo.affineRAS,
        invAffineRAS: math.inv(contextInfo.affineRAS),
      };
    }

    set(null, toUpdate);
  };
};

const getProtobufProcessNNRecordTensor = (
  binaryArray: Uint8Array,
  dimsSAR: number[],
) => {
  const item_pb = nnextractor_pb.NNRecord.fromBinary(binaryArray);

  const tensorBinary = item_pb.tensor?.theBytes ?? null;

  return bytesToNNTensor(tensorBinary, dimsSAR);
};

const getProtobufProcessItemTensor = (
  binaryArray: Uint8Array,
  dimsSAR: number[],
) => {
  const item_pb = nnextractor_pb.Item.fromBinary(binaryArray);

  if (item_pb.theType === nnextractor_pb.ItemType.I_NII && item_pb.nii) {
    const nntensorBinary = item_pb.nii.tensor?.theBytes ?? null;
    return bytesToNNTensor(nntensorBinary, dimsSAR);
  }

  if (isTensorType_pb(item_pb.theType)) {
    const tensorBinary = item_pb.tensor?.theBytes ?? null;
    return bytesToNNTensor(tensorBinary, dimsSAR);
  }

  return null;
};

const getProtobufProcessOpItemTensor = (
  binaryArray: Uint8Array,
  dimsSAR: number[],
  isSegmentation?: boolean,
) => {
  const op_item_pb = nnextractor_pb.OpItem.fromBinary(binaryArray);

  const nntensorBinary = op_item_pb.tensor?.theBytes ?? null;

  const arrayType = isSegmentation
    ? NNTensorArrayType.UINT8
    : NNTensorArrayType.FLOAT32;

  return bytesToNNTensor(nntensorBinary, dimsSAR, arrayType);
};

const inferOriginRASDirectionRASSpacingRASFromAffineRAS = (
  affineRAS: number[][],
): [number[], number[][], number[]] => {
  const origin = [
    affineRAS[0][3],
    affineRAS[1][3],
    affineRAS[2][3],
    affineRAS[3][3],
  ];
  const [spacing0, direction0] = spacingDirection(
    affineRAS[0][0],
    affineRAS[1][0],
    affineRAS[2][0],
  );
  const [spacing1, direction1] = spacingDirection(
    affineRAS[0][1],
    affineRAS[1][1],
    affineRAS[2][1],
  );
  const [spacing2, direction2] = spacingDirection(
    affineRAS[0][2],
    affineRAS[1][2],
    affineRAS[2][2],
  );

  const spacing = [spacing0, spacing1, spacing2];
  const direction = [
    [direction0[0], direction1[0], direction2[0]],
    [direction0[1], direction1[1], direction2[1]],
    [direction0[2], direction1[2], direction2[2]],
  ];

  return [origin, direction, spacing];
};

const spacingDirection = (
  dir0: number,
  dir1: number,
  dir2: number,
): [number, number[]] => {
  const spacing = Math.sqrt(dir0 * dir0 + dir1 * dir1 + dir2 * dir2);
  return [spacing, [dir0 / spacing, dir1 / spacing, dir2 / spacing]];
};
