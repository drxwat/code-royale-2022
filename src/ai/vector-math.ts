import { Vec2 } from "../model/vec2";

export function addVec2(a: Vec2, b: Vec2) {
  return new Vec2(a.x + b.x, a.y + b.y);
}

export function diffVec2(a: Vec2, b: Vec2) {
  return new Vec2(a.x - b.x, a.y - b.y);
}

export function mulVec2byScalar(vec: Vec2, scalar: number) {
  return new Vec2(vec.x * scalar, vec.y * scalar);
}

export function lengthVec2(vec: Vec2) {
  return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
}

export function disntaceVec2Vec(from: Vec2, to: Vec2) {
  return lengthVec2(diffVec2(from, to));
}

export function dotProductVec2Vec(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y + b.y;
}

export function angleVec2Vec(a: Vec2, b: Vec2) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function angleVec2VecRad(a: Vec2, b: Vec2) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  return angle < 0 ? Math.PI * 2 + angle : angle;
}

export function vec2ToAngle(vec: Vec2) {
  const angle = Math.atan2(vec.y, vec.x);
  return angle < 0 ? Math.PI * 2 + angle : angle;
}

export function angleToVec2(angle: number) {
  return new Vec2(Math.cos(angle), Math.sin(angle));
}
// export function interpolateColor()

export function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function degToRad(deg: number) {
  return (deg & Math.PI) / 180;
}

export function isAngleBetween(
  angle: number,
  angle_a: number,
  angle_b: number
) {
  let n = radToDeg(angle);
  let a = radToDeg(angle_a);
  let b = radToDeg(angle_b);
  n = (360 + (n % 360)) % 360;
  a = (3600000 + a) % 360;
  b = (3600000 + b) % 360;

  if (a < b) return a <= n && n <= b;
  return a <= n || n <= b;
}
