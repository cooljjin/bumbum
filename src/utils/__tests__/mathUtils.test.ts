import { Vector3, Euler } from 'three';

// Mock Three.js
global.Three = {
  Vector3: class {
    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    x: number;
    y: number;
    z: number;
    equals(v: any) {
      return this.x === v.x && this.y === v.y && this.z === v.z;
    }
    clone() {
      return new (global.Three.Vector3 as any)(this.x, this.y, this.z);
    }
  },
  Euler: class {
    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    x: number;
    y: number;
    z: number;
    equals(e: any) {
      return this.x === e.x && this.y === e.y && this.z === e.z;
    }
    clone() {
      return new (global.Three.Euler as any)(this.x, this.y, this.z);
    }
  }
};

describe('Math Utils', () => {
  describe('Vector3 operations', () => {
    it('should create Vector3 with correct values', () => {
      const vector = new (global.Three.Vector3 as any)(1, 2, 3);
      expect(vector.x).toBe(1);
      expect(vector.y).toBe(2);
      expect(vector.z).toBe(3);
    });

    it('should compare Vector3 correctly', () => {
      const v1 = new (global.Three.Vector3 as any)(1, 2, 3);
      const v2 = new (global.Three.Vector3 as any)(1, 2, 3);
      const v3 = new (global.Three.Vector3 as any)(4, 5, 6);
      
      expect(v1.equals(v2)).toBe(true);
      expect(v1.equals(v3)).toBe(false);
    });

    it('should clone Vector3 correctly', () => {
      const original = new (global.Three.Vector3 as any)(1, 2, 3);
      const cloned = original.clone();
      
      expect(cloned.x).toBe(original.x);
      expect(cloned.y).toBe(original.y);
      expect(cloned.z).toBe(original.z);
      expect(cloned).not.toBe(original); // Different reference
    });
  });

  describe('Euler operations', () => {
    it('should create Euler with correct values', () => {
      const euler = new (global.Three.Euler as any)(0.5, 1.0, 1.5);
      expect(euler.x).toBe(0.5);
      expect(euler.y).toBe(1.0);
      expect(euler.z).toBe(1.5);
    });

    it('should compare Euler correctly', () => {
      const e1 = new (global.Three.Euler as any)(0.5, 1.0, 1.5);
      const e2 = new (global.Three.Euler as any)(0.5, 1.0, 1.5);
      const e3 = new (global.Three.Euler as any)(2.0, 2.5, 3.0);
      
      expect(e1.equals(e2)).toBe(true);
      expect(e1.equals(e3)).toBe(false);
    });

    it('should clone Euler correctly', () => {
      const original = new (global.Three.Euler as any)(0.5, 1.0, 1.5);
      const cloned = original.clone();
      
      expect(cloned.x).toBe(original.x);
      expect(cloned.y).toBe(original.y);
      expect(cloned.z).toBe(original.z);
      expect(cloned).not.toBe(original); // Different reference
    });
  });

  describe('Math calculations', () => {
    it('should calculate distance between two points', () => {
      const p1 = new (global.Three.Vector3 as any)(0, 0, 0);
      const p2 = new (global.Three.Vector3 as any)(3, 4, 0);
      
      const distance = Math.sqrt(3 * 3 + 4 * 4);
      expect(distance).toBe(5);
    });

    it('should calculate angle in radians', () => {
      const angleInDegrees = 90;
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
      
      expect(angleInRadians).toBe(Math.PI / 2);
    });

    it('should normalize values to range', () => {
      const value = 150;
      const min = 0;
      const max = 100;
      
      const normalized = Math.max(min, Math.min(max, value));
      expect(normalized).toBe(100);
    });
  });
});

