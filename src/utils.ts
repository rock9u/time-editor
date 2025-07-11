// https://stackoverflow.com/questions/49091970/how-to-make-a-spiral-in-svg

export function lineIntersection(
  m1: number,
  b1: number,
  m2: number,
  b2: number
) {
  if (m1 === m2) {
    throw new Error('parallel slopes')
  }
  const x = (b2 - b1) / (m1 - m2)
  return { x: x, y: m1 * x + b1 }
}

export function pStr(point: { x: number; y: number }) {
  return `${point.x},${point.y} `
}
