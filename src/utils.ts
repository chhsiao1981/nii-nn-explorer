export const isEmpty = (obj: object) => {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) return false
  }

  return true
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const matMul = (matA: number[][], matB: number[][]) => {
  const mA = matA.length
  const nA = matA[0].length
  const nB = matB[0].length

  const matC = Array.from({ length: mA }).map(() => Array.from({ length: nB }).map(() => 0))
  for (let idxM = 0; idxM < mA; idxM++) {
    for (let idxN = 0; idxN < nB; idxN++) {
      for (let idxK = 0; idxK < nA; idxK++) {
        matC[idxM][idxN] += matA[idxM][idxK] * matB[idxK][idxN]
      }
    }
  }

  return matC
}
