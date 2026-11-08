import React from 'react';
import {
  Sparkles,
  GraduationCap,
  UserCheck,
  Plus,
  Download,
  HelpCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Glasses,
  Compass,
  Save,
  Layers
} from 'lucide-react';
import { UserRole, ZoneType } from '../types/classroom';
import { soundService } from '../services/audioService';

interface TopHeaderProps {
  role: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  onOpenNewFrame: () => void;
  onOpenExportImport: () => void;
  onOpenHelp: () => void;
  onResetCamera: () => void;
  onToggleVR: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedZone: ZoneType | 'all';
  onFilterZone: (zone: ZoneType | 'all') => void;
  isLeftMenuCollapsed?: boolean;
  onToggleLeftMenu?: () => void;
  onManualSave?: () => void;
  activeSpaceName?: string;
  onOpenSpacesModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  role,
  onRoleChange,
  onOpenNewFrame,
  onOpenExportImport,
  onOpenHelp,
  onResetCamera,
  onToggleVR,
  isMuted,
  onToggleMute,
  isLeftMenuCollapsed,
  onToggleLeftMenu,
  onManualSave,
  activeSpaceName,
  onOpenSpacesModal,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-4 flex items-center justify-between">
      {/* Left: App Title and Educational Branding */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {onToggleLeftMenu && (
          <button
            onClick={() => {
              soundService.playClick();
              onToggleLeftMenu();
            }}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
              !isLeftMenuCollapsed
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sky-500/25'
                : 'bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border-slate-700/80'
            }`}
            title="Bật / tắt Menu khu vực bên trái (Phím H)"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Menu Khu Vực</span>
          </button>
        )}

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-500/30 shadow-lg shadow-sky-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-white tracking-wide">
                LỚP HỌC ẢO 3D
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Sáng tạo
              </span>
            </div>
            <p className="text-[11px] text-sky-200/70 hidden sm:block">
              Không gian học tập & tương tác 3D VR trực quan
            </p>
          </div>
        </div>

        {/* Room Space Switcher Pill */}
        {onOpenSpacesModal && (
          <button
            onClick={() => {
              soundService.playClick();
              onOpenSpacesModal();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-200 hover:text-white shadow-lg shadow-indigo-950/50 backdrop-blur-md transition-all cursor-pointer group"
            title="Đổi không gian phòng học ảo hoặc tạo phòng mới"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[10px] text-indigo-400 font-semibold leading-tight uppercase">Không gian phòng học</p>
              <p className="text-xs font-bold text-white truncate max-w-[140px]">
                {activeSpaceName || 'Phòng học 1'}
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-300 md:hidden">
              Phòng học ▾
            </span>
            <span className="text-indigo-400 text-xs hidden md:inline group-hover:translate-y-0.5 transition-transform">▾</span>
          </button>
        )}
      </div>

      {/* Right: Role Switcher & Action Buttons */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        {/* Role Toggle Pill */}
        <div className="flex items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-lg">
          <button
            onClick={() => {
              soundService.playClick();
              onRoleChange('teacher');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              role === 'teacher'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Chế độ Giáo viên: Có quyền thêm, chỉnh sửa, di chuyển và xóa khung học liệu"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden md:inline">Chế độ</span> Giáo viên
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onRoleChange('student');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              role === 'student'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Chế độ Học sinh: Chỉ xem và tương tác, không chỉnh sửa"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden md:inline">Chế độ</span> Học sinh
          </button>
        </div>

        {/* Add Frame Button (Teacher only) */}
        {role === 'teacher' && (
          <button
            onClick={() => {
              soundService.playClick();
              onOpenNewFrame();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
            title="Tạo khung nội dung mới trong phòng học 3D"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Thêm khung 3D</span>
          </button>
        )}

        {/* Save Classroom Data Button (Teacher only) */}
        {role === 'teacher' && onManualSave && (
          <button
            onClick={() => {
              soundService.playSuccess();
              onManualSave();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
            title="Lưu lại toàn bộ dữ liệu nội dung phòng học vào bộ nhớ vĩnh viễn"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Lưu dữ liệu</span>
          </button>
        )}

        {/* Export / Backup modal */}
        <button
          onClick={() => {
            soundService.playClick();
            onOpenExportImport();
          }}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-sky-300 hover:bg-slate-800 border border-slate-700/60 shadow-lg transition-all flex items-center gap-1.5 text-xs sm:text-sm"
          title="Sao lưu & Khôi phục cấu hình phòng học"
        >
          <Download className="w-4 h-4" />
          <span className="hidden lg:inline">Sao lưu</span>
        </button>

        {/* Reset Camera Button */}
        <button
          onClick={() => {
            soundService.playClick();
            onResetCamera();
          }}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-sky-300 hover:bg-slate-800 border border-slate-700/60 shadow-lg transition-all flex items-center gap-1.5 text-xs sm:text-sm"
          title="Đưa góc nhìn camera về vị trí tổng quan lớp học"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden lg:inline">Góc nhìn</span>
        </button>

        {/* VR Toggle */}
        <button
          onClick={() => {
            soundService.playClick();
            onToggleVR();
          }}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 border border-purple-500/40 shadow-lg transition-all flex items-center gap-1.5 text-xs sm:text-sm"
          title="Bật chế độ kính thực tế ảo 3D VR (WebXR)"
        >
          <Glasses className="w-4 h-4 text-purple-300" />
          <span className="hidden xl:inline">VR 3D</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 shadow-lg transition-all"
          title={isMuted ? 'Bật âm thanh hiệu ứng' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
        </button>

        {/* Help button */}
        <button
          onClick={() => {
            soundService.playClick();
            onOpenHelp();
          }}
          className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 shadow-lg transition-all"
          title="Hướng dẫn điều khiển 3D và phím tắt"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
