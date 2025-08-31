// DRACOLoader 모킹
export class DRACOLoader {
  constructor() {
    this.decoderPath = '';
    this.decoderConfig = {};
    this.workerLimit = 4;
    this.workerPool = [];
  }

  setDecoderPath(path) {
    this.decoderPath = path;
    return this;
  }

  setDecoderConfig(config) {
    this.decoderConfig = config;
    return this;
  }

  setWorkerLimit(workerLimit) {
    this.workerLimit = workerLimit;
    return this;
  }

  preload() {
    return this;
  }

  dispose() {
    this.workerPool = [];
    return this;
  }

  decode(data, callback) {
    // 모킹된 디코더는 즉시 성공 콜백을 호출
    if (callback) {
      callback({ index: new Uint32Array(), attributes: {} });
    }
    return this;
  }
}

export default DRACOLoader;
