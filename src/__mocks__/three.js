// Three.js 모듈 모킹
export const Vector3 = jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
  x, y, z,
  set: jest.fn(),
  copy: jest.fn(),
  clone: jest.fn(),
  add: jest.fn(),
  sub: jest.fn(),
  multiply: jest.fn(),
  divide: jest.fn(),
  length: jest.fn(),
  normalize: jest.fn(),
  distanceTo: jest.fn(),
  lerp: jest.fn(),
}));

export const Euler = jest.fn().mockImplementation((x = 0, y = 0, z = 0, order = 'XYZ') => ({
  x, y, z, order,
  set: jest.fn(),
  copy: jest.fn(),
  clone: jest.fn(),
  reorder: jest.fn(),
}));

export const Object3D = jest.fn().mockImplementation(() => ({
  position: new Vector3(),
  rotation: new Euler(),
  scale: new Vector3(),
  children: [],
  add: jest.fn(),
  remove: jest.fn(),
  getObjectById: jest.fn(),
  traverse: jest.fn(),
  updateMatrix: jest.fn(),
  updateMatrixWorld: jest.fn(),
}));

export const Mesh = jest.fn().mockImplementation(() => ({
  ...new Object3D(),
  geometry: { dispose: jest.fn() },
  material: { dispose: jest.fn() },
}));

export const Scene = jest.fn().mockImplementation(() => ({
  ...new Object3D(),
  background: null,
  fog: null,
  dispose: jest.fn(),
}));

export const PerspectiveCamera = jest.fn().mockImplementation(() => ({
  ...new Object3D(),
  fov: 75,
  aspect: 1,
  near: 0.1,
  far: 1000,
  updateProjectionMatrix: jest.fn(),
}));

export const WebGLRenderer = jest.fn().mockImplementation(() => ({
  domElement: document.createElement('canvas'),
  setSize: jest.fn(),
  setClearColor: jest.fn(),
  render: jest.fn(),
  dispose: jest.fn(),
}));

export const BoxGeometry = jest.fn().mockImplementation(() => ({
  dispose: jest.fn(),
}));

export const MeshBasicMaterial = jest.fn().mockImplementation(() => ({
  dispose: jest.fn(),
}));

export const AmbientLight = jest.fn().mockImplementation(() => ({
  ...new Object3D(),
  intensity: 1,
  dispose: jest.fn(),
}));

export const DirectionalLight = jest.fn().mockImplementation(() => ({
  ...new Object3D(),
  intensity: 1,
  dispose: jest.fn(),
}));

export const Clock = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  getElapsedTime: jest.fn(() => 0),
  getDelta: jest.fn(() => 0.016),
}));

export const Raycaster = jest.fn().mockImplementation(() => ({
  set: jest.fn(),
  setFromCamera: jest.fn(),
  intersectObjects: jest.fn(() => []),
}));

export const Plane = jest.fn().mockImplementation(() => ({
  set: jest.fn(),
  setFromNormalAndCoplanarPoint: jest.fn(),
}));

export default {
  Vector3,
  Euler,
  Object3D,
  Mesh,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  AmbientLight,
  DirectionalLight,
  Clock,
  Raycaster,
  Plane,
};
