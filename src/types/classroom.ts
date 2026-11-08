export type ZoneType =
  | 'smart_board'      // Bảng tương tác thông minh
  | 'image_gallery'    // Kho hình ảnh
  | 'video_theater'    // Rạp chiếu video
  | 'game_zone'        // Trò chơi tương tác
  | 'resource_library';// Học liệu số

export type FrameContentType = 'image' | 'video' | 'game' | 'resource';

export interface FrameContent {
  imageUrl?: string;        // Data URL or web URL
  imageName?: string;
  videoUrl?: string;        // Data URL or direct video URL / YouTube embed
  videoName?: string;
  embedCode?: string;       // HTML / iframe embed code
  docUrl?: string;          // Direct document URL
  docTitle?: string;
  resourceType?: 'image' | 'video' | 'doc' | 'embed';
}

export interface ClassroomFrame {
  id: string;
  zone: ZoneType;
  type: FrameContentType;
  title: string;
  slotIndex: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  content: FrameContent;
  isCustomAdded?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = 'teacher' | 'student';

export type CameraPreset =
  | 'overview'
  | 'smart_board'
  | 'image_gallery'
  | 'video_theater'
  | 'game_zone'
  | 'resource_library'
  | 'teacher_podium';

export interface ZoneConfig {
  id: ZoneType;
  name: string;
  shortName: string;
  description: string;
  color: string;
  glowColor: string;
  iconName: string;
  cameraPreset: CameraPreset;
}

export type ClassroomTheme = 'future_blue' | 'nature_green' | 'cosmic_space' | 'warm_wood';

export interface ThemeConfig {
  id: ClassroomTheme;
  name: string;
  description: string;
  primaryColor: string;
  wallColorHex: number;
  wainscotColorHex: number;
  baseboardColorHex: number;
  ambientLightHex: number;
  keyLightHex: number;
  fogColorHex: number;
  icon: string;
}

export interface ClassroomSpace {
  id: string;
  name: string;
  description: string;
  theme: ClassroomTheme;
  bannerText: string;
  frames: ClassroomFrame[];
  createdAt: number;
  updatedAt: number;
}

