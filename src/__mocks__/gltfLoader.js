// GLTFLoader 모킹
export class GLTFLoader {
  constructor() {
    this.manager = null;
  }

  setManager(manager) {
    this.manager = manager;
    return this;
  }

  load(url, onLoad, onProgress, onError) {
    // 모킹된 로더는 즉시 성공 콜백을 호출
    if (onLoad) {
      const mockScene = {
        scene: { children: [] },
        animations: [],
        nodes: {},
        materials: {},
        scenes: [],
        cameras: [],
        asset: { version: '2.0' }
      };
      onLoad(mockScene);
    }
    return this;
  }

  parse(data, path, onLoad, onError) {
    if (onLoad) {
      const mockScene = {
        scene: { children: [] },
        animations: [],
        nodes: {},
        materials: {},
        scenes: [],
        cameras: [],
        asset: { version: '2.0' }
      };
      onLoad(mockScene);
    }
    return this;
  }
}

export default GLTFLoader;
