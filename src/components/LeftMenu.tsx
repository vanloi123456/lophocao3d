import React from 'react';
import {
  Home,
  Monitor,
  Image,
  Film,
  Gamepad2,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Maximize2,
  Trash2,
  Plus,
  Download,
  RotateCcw,
  Glasses,
  HelpCircle,
  Compass,
  X,
  Eraser,
  Save,
  Layers
} from 'lucide-react';
import { CameraPreset, ClassroomFrame, UserRole, ZoneType } from '../types/classroom';
import { ZONE_CONFIGS } from '../data/defaultClassroom';
import { soundService } from '../services/audioService';

interface LeftMenuProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  selectedFrame: ClassroomFrame | null;
  hoveredFrame: ClassroomFrame | null;
  onEditSelectedFrame: () => void;
  onViewSelectedFrame: () => void;
  onDeleteSelectedFrame: () => void;
  onClearSelectedFrameContent: () => void;
  onClearSelection: () => void;
  onOpenNewFrame: () => void;
  onOpenExportImport: () => void;
  onResetCamera: () => void;
  onToggleVR: () => void;
  onOpenHelp: () => void;
  onManualSave?: () => void;
  role: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSpaceName?: string;
  onOpenSpacesModal?: () => void;
}

export const LeftMenu: React.FC<LeftMenuProps> = ({
  currentPreset,
  onSelectPreset,
  selectedFrame,
  hoveredFrame,
  onEditSelectedFrame,
  onViewSelectedFrame,
  onDeleteSelectedFrame,
  onClearSelectedFrameContent,
  onClearSelection,
  onOpenNewFrame,
  onOpenExportImport,
  onResetCamera,
  onToggleVR,
  onOpenHelp,
  onManualSave,
  role,
  isCollapsed,
  onToggleCollapse,
  activeSpaceName,
  onOpenSpacesModal,
}) => {
  const activeFrame = selectedFrame || hoveredFrame;
  const activeZoneCfg = activeFrame ? ZONE_CONFIGS[activeFrame.zone] : null;

  const presets: { id: CameraPreset; label: string; subLabel: string; icon: React.ReactNode; color: string; zone?: ZoneType }[] = [
    {
      id: 'overview',
      label: 'Tổng quan lớp học',
      subLabel: 'Góc nhìn toàn cảnh 3D',
      icon: <Home className="w-4 h-4" />,
      color: '#38bdf8',
    },
    {
      id: 'smart_board',
      label: 'Bảng thông minh',
      subLabel: 'Màn hình trung tâm',
      icon: <Monitor className="w-4 h-4" />,
      color: '#06b6d4',
      zone: 'smart_board',
    },
    {
      id: 'image_gallery',
      label: 'Kho hình ảnh',
      subLabel: '6 khung tranh triển lãm',
      icon: <Image className="w-4 h-4" />,
      color: '#ec4899',
      zone: 'image_gallery',
    },
    {
      id: 'video_theater',
      label: 'Rạp chiếu video',
      subLabel: '4 màn chiếu đa góc',
      icon: <Film className="w-4 h-4" />,
      color: '#f59e0b',
      zone: 'video_theater',
    },
    {
      id: 'game_zone',
      label: 'Trò chơi tương tác',
      subLabel: '6 kiosk trò chơi nhúng',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: '#10b981',
      zone: 'game_zone',
    },
    {
      id: 'resource_library',
      label: 'Học liệu số',
      subLabel: '6 khung kệ sách số',
      icon: <BookOpen className="w-4 h-4" />,
      color: '#8b5cf6',
      zone: 'resource_library',
    },
    {
      id: 'teacher_podium',
      label: 'Bục giảng giáo viên',
      subLabel: 'Vị trí điều hành lớp',
      icon: <User className="w-4 h-4" />,
      color: '#0ea5e9',
    },
  ];

  return (
    <aside
      className={`fixed left-3 sm:left-4 top-20 bottom-4 z-20 pointer-events-auto flex transition-all duration-300 ease-in-out ${
        isCollapsed ? '-translate-x-[calc(100%-14px)]' : 'translate-x-0'
      }`}
    >
      {/* Main Glassmorphic Left Sidebar Panel */}
      <div className="w-72 sm:w-80 h-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl shadow-slate-950/60 flex flex-col overflow-hidden">
        {/* Left Menu Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/90 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                MENU ĐIỀU HƯỚNG
              </h2>
              <p className="text-[11px] text-sky-300/70">Chọn khu vực trong phòng học</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playClick();
              onToggleCollapse();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Thu gọn menu (Phím H)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Active Space Indicator & Switcher Button */}
          {onOpenSpacesModal && (
            <button
              onClick={() => {
                soundService.playClick();
                onOpenSpacesModal();
              }}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-left transition-all cursor-pointer shadow-md group flex items-center justify-between"
              title="Nhấn để đổi không gian phòng học hoặc thêm phòng mới"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Không gian phòng học</p>
                  <p className="text-xs font-bold text-white truncate">{activeSpaceName || 'Phòng học 1'}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-1 rounded-lg border border-indigo-500/30 shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                Đổi phòng ▾
              </span>
            </button>
          )}

          {/* Active Frame Inspection Card (if selected) */}
          {selectedFrame && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-sky-500/50 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-md"
                    style={{ backgroundColor: activeZoneCfg?.color || '#38bdf8' }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{selectedFrame.title}</p>
                    <p className="text-[10px] text-sky-300 truncate">{activeZoneCfg?.name}</p>
                  </div>
                </div>

                <button
                  onClick={onClearSelection}
                  className="p-1 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Bỏ chọn khung"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions on selected frame */}
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => {
                    soundService.playSelect();
                    onViewSelectedFrame();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Xem / Tương tác toàn màn hình</span>
                </button>

                {role === 'teacher' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        soundService.playSelect();
                        onEditSelectedFrame();
                      }}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs border border-indigo-500/30 transition-all cursor-pointer"
                      title="Thêm hoặc sửa nội dung hình ảnh, video, mã nhúng"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Thêm / Sửa nội dung</span>
                    </button>

                    {Boolean(selectedFrame.content.imageUrl || selectedFrame.content.videoUrl || selectedFrame.content.embedCode || selectedFrame.content.docUrl) && (
                      <button
                        onClick={() => {
                          soundService.playDelete();
                          onClearSelectedFrameContent();
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] border border-amber-500/30 transition-all cursor-pointer"
                        title="Xóa dữ liệu trong khung, đưa khung về trạng thái trống ban đầu"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Xóa nội dung</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        soundService.playDelete();
                        onDeleteSelectedFrame();
                      }}
                      className={`${
                        Boolean(selectedFrame.content.imageUrl || selectedFrame.content.videoUrl || selectedFrame.content.embedCode || selectedFrame.content.docUrl)
                          ? 'col-span-1'
                          : 'col-span-2'
                      } flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition-all cursor-pointer`}
                      title="Xóa luôn khung 3D khỏi lớp học"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa khung</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3D Classroom Zones List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Khu Vực Trong Phòng Học:
            </span>

            {presets.map((p) => {
              const isActive = currentPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    soundService.playSelect();
                    onSelectPreset(p.id);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="p-2 rounded-xl shrink-0"
                      style={{
                        backgroundColor: `${p.color}25`,
                        color: p.color,
                        boxShadow: isActive ? `0 0 12px ${p.color}40` : 'none',
                      }}
                    >
                      {p.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-sky-300 font-bold' : 'text-slate-200'}`}>
                        {p.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{p.subLabel}</p>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/30 shrink-0">
                      Đang xem
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Tools & Shortcuts */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Thao Tác Nhanh:
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {role === 'teacher' && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onOpenNewFrame();
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold cursor-pointer transition-all"
                  title="Thêm khung nội dung mới trong 3D"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  <span className="truncate">+ Thêm khung</span>
                </button>
              )}

              {role === 'teacher' && onManualSave && (
                <button
                  onClick={() => {
                    soundService.playSuccess();
                    onManualSave();
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-all"
                  title="Lưu lại toàn bộ dữ liệu bài học vào bộ nhớ vĩnh viễn"
                >
                  <Save className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">Lưu dữ liệu</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundService.playClick();
                  onResetCamera();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                title="Đưa góc nhìn về ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">Đặt lại góc nhìn</span>
              </button>

              <button
                onClick={() => {
                  soundService.playClick();
                  onOpenExportImport();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                title="Sao lưu & khôi phục bài học"
              >
                <Download className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">Sao lưu tệp</span>
              </button>

              <button
                onClick={() => {
                  soundService.playClick();
                  onToggleVR();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold cursor-pointer transition-all"
                title="Bật kính thực tế ảo 3D VR"
              >
                <Glasses className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span className="truncate">Kính VR 3D</span>
              </button>

              <button
                onClick={() => {
                  soundService.playClick();
                  onOpenHelp();
                }}
                className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                title="Hướng dẫn phím W/A/S/D và thao tác chuột"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>Hướng dẫn điều khiển 3D (W/A/S/D)</span>
              </button>

              {onOpenSpacesModal && (
                <button
                  onClick={() => {
                    soundService.playClick();
                    onOpenSpacesModal();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer transition-all"
                  title="Xem danh sách hoặc thêm phòng học ảo mới"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span>Quản lý & Thêm phòng học ảo 3D</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer tip */}
        <div className="p-2.5 px-3.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Phím tắt: <strong>H</strong> (ẩn/hiện menu)</span>
          <span className="text-sky-400 font-medium">VR Ready</span>
        </div>
      </div>

      {/* Slide-out Toggle Tab attached to right edge of menu */}
      <div className="self-center -ml-px z-30">
        <button
          onClick={() => {
            soundService.playClick();
            onToggleCollapse();
          }}
          className="flex flex-col items-center justify-center py-4 px-1.5 rounded-r-2xl bg-slate-900/95 hover:bg-slate-800 text-sky-400 border-y border-r border-slate-700 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:px-2 group"
          title={isCollapsed ? 'Mở menu bên trái' : 'Thu gọn menu bên trái (Phím H)'}
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] text-[11px] font-bold tracking-wider mt-2 text-slate-300 group-hover:text-white uppercase">
                Menu Khu Vực
              </span>
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-rl] text-[10px] font-medium tracking-wider mt-2 text-slate-400 group-hover:text-slate-300">
                Thu gọn
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
