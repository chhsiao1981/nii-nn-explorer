export const direction_1d_to_2d = (direction_1d: number[]): number[][] => {
  return [0, 3, 6].map((each) => direction_1d.slice(each, each + 3))
}

export const affine_1d_to_2d = (affine_1d: number[]): number[][] => {
  return [0, 4, 8, 12].map((each) => affine_1d.slice(each, each + 4))
}
