export interface DesktopFileOpenResult {
  canceled: boolean;
  filePath?: string;
  content?: string;
}

export interface DesktopFileSaveResult {
  canceled: boolean;
  filePath?: string;
}

export interface DesktopAppInfo {
  name: string;
  version: string;
  platform: string;
}

export interface DesktopAPI {
  openPlantFile: () => Promise<DesktopFileOpenResult>;
  savePlantFile: (content: string, defaultName?: string) => Promise<DesktopFileSaveResult>;
  setWindowTitle: (title: string) => void;
  getAppInfo: () => Promise<DesktopAppInfo>;
}

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}
