import { tableFromIPC } from 'apache-arrow'
import { type RecursiveNumber, type NNTensor, NNTensorArrayType } from './types'

export const reshape1d = (ary_1d: number[], shape: number[]): [RecursiveNumber, number[]] => {
  if (ary_1d.length === 0) {
    console.warn('reshape_1d: no length for ary_1d')
    return [[], ary_1d]
  }

  if (shape.length === 0) {
    console.warn('reshape_1d: no length for shape')
    return [[], ary_1d]
  }

  if (shape.length === 1) {
    return [ary_1d.slice(0, shape[0]), ary_1d.slice(shape[0])]
  }

  let remain = ary_1d
  const array: RecursiveNumber = []
  for (let i = 0; i < shape[0]; i++) {
    const [eachArray, eachRemain] = reshape1d(remain, shape.slice(1))
    array[i] = eachArray
    remain = eachRemain
  }

  return [array, remain]
}

export const bytesToNNTensor = (
  theBytes: Uint8Array<ArrayBufferLike> | null,
  shape: number[],
  arrayType: NNTensorArrayType,
): NNTensor | null => {
  if (!theBytes) {
    return null
  }
  const theTable = tableFromIPC(theBytes)
  const array_1d = theTable.toArray().map((each): number => each.toArray()[0])

  // [INFO] no need to tranfer to array_nd because it will be used in
  //        glTexSubImage3D.
  //
  // https://github.com/niivue/niivue/blob/main/packages/niivue/src/niivue/index.ts#L6398
  //
  // const [array_nd, _] = reshape1d(array_1d, shape)
  const array =
    arrayType === NNTensorArrayType.UINT8 ? new Uint8Array(array_1d) : new Float32Array(array_1d)
  return { shape: shape, array }
}
