export interface Theme {
  name: string;
  colors: {
    background: string;
    floor: string;
    walls: string;
    ceiling: string;
    furniture: {
      bed: string;
      bedFrame: string;
      bedPillow: string;
      table: string;
      tableLeg: string;
      plant: string;
      plantPot: string;
    };
  };
  lighting: {
    ambient: {
      intensity: number;
      color: string;
    };
    directional: {
      intensity: number;
      color: string;
      position: [number, number, number];
    };
    hemisphere: {
      intensity: number;
      skyColor: string;
      groundColor: string;
    };
  };
  mood: string;
}

export const themes: Record<string, Theme> = {
  calm: {
    name: 'Calm',
    colors: {
      background: '#f0f4f8',
      floor: '#e2e8f0',
      walls: '#cbd5e1',
      ceiling: '#f1f5f9',
      furniture: {
        bed: '#e0e7ff',
        bedFrame: '#c7d2fe',
        bedPillow: '#f8fafc',
        table: '#fef3c7',
        tableLeg: '#fde68a',
        plant: '#86efac',
        plantPot: '#fbbf24'
      }
    },
    lighting: {
      ambient: {
        intensity: 0.6,
        color: '#ffffff'
      },
      directional: {
        intensity: 0.8,
        color: '#e2e8f0',
        position: [2.5, 5, 3]
      },
      hemisphere: {
        intensity: 0.5,
        skyColor: '#e0e7ff',
        groundColor: '#f1f5f9'
      }
    },
    mood: '차분하고 평화로운 분위기'
  },
  cozy: {
    name: 'Cozy',
    colors: {
      background: '#fef3c7',
      floor: '#fde68a',
      walls: '#fbbf24',
      ceiling: '#fef7cd',
      furniture: {
        bed: '#fecaca',
        bedFrame: '#fca5a5',
        bedPillow: '#fef2f2',
        table: '#d1d5db',
        tableLeg: '#9ca3af',
        plant: '#a7f3d0',
        plantPot: '#f59e0b'
      }
    },
    lighting: {
      ambient: {
        intensity: 0.7,
        color: '#fef3c7'
      },
      directional: {
        intensity: 0.9,
        color: '#fbbf24',
        position: [2.5, 5, 3]
      },
      hemisphere: {
        intensity: 0.6,
        skyColor: '#fef3c7',
        groundColor: '#fde68a'
      }
    },
    mood: '따뜻하고 아늑한 분위기'
  },
  vivid: {
    name: 'Vivid',
    colors: {
      background: '#fce7f3',
      floor: '#f3e8ff',
      walls: '#e0e7ff',
      ceiling: '#fef7ff',
      furniture: {
        bed: '#c7d2fe',
        bedFrame: '#a5b4fc',
        bedPillow: '#f8fafc',
        table: '#fbbf24',
        tableLeg: '#f59e0b',
        plant: '#86efac',
        plantPot: '#10b981'
      }
    },
    lighting: {
      ambient: {
        intensity: 0.8,
        color: '#ffffff'
      },
      directional: {
        intensity: 1.0,
        color: '#e0e7ff',
        position: [2.5, 5, 3]
      },
      hemisphere: {
        intensity: 0.7,
        skyColor: '#fce7f3',
        groundColor: '#f3e8ff'
      }
    },
    mood: '생동감 있고 활기찬 분위기'
  }
};

export const defaultTheme = themes.calm;
