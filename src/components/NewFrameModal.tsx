import React, { useState } from 'react';
import { X, Plus, Sparkles, Monitor, Image, Film, Gamepad2, BookOpen } from 'lucide-react';
import { ClassroomFrame, FrameContentType, ZoneType } from '../types/classroom';
import { ZONE_CONFIGS } from '../data/defaultClassroom';
import { soundService } from '../services/audioService';

interface NewFrameModalProps {
  onAddFrame: (newFrame: ClassroomFrame) => void;
  onClose: () => void;
  existingFrames: ClassroomFrame[];
}

export const NewFrameModal: React.FC<NewFrameModalProps> = ({
  onAddFrame,
  onClose,
  existingFrames,
}) => {
  const [zone, setZone] = useState<ZoneType>('smart_board');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FrameContentType>('resource');

  const zoneOptions: { id: ZoneType; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'smart_board', name: 'Bảng tương tác thông minh', icon: <Monitor className="w-4 h-4" />, color: '#06b6d4' },
    { id: 'image_gallery', name: 'Kho hình ảnh', icon: <Image className="w-4 h-4" />, color: '#ec4899' },
    { id: 'video_theater', name: 'Rạp chiếu video', icon: <Film className="w-4 h-4" />, color: '#f59e0b' },
    { id: 'game_zone', name: 'Trò chơi tương tác', icon: <Gamepad2 className="w-4 h-4" />, color: '#10b981' },
    { id: 'resource_library', name: 'Học liệu số', icon: <BookOpen className="w-4 h-4" />, color: '#8b5cf6' },
  ];

  const handleCreate = () => {
    soundService.playSuccess();
    const frameId = `frame-custom-${Date.now()}`;
    const zoneFrames = existingFrames.filter(f => f.zone === zone);
    const count = zoneFrames.length;

    // Calculate smart 3D placement so it doesn't collide
    let position: [number, number, number] = [0, 3.0, 0];
    let rotation: [number, number, number] = [0, 0, 0];
    let scale: [number, number, number] = [2.6, 1.8, 0.12];

    if (zone === 'smart_board') {
      position = [0, 3.2 + count * 0.1, -11.5];
      rotation = [0, 0, 0];
      scale = [5.5, 3.2, 0.15];
    } else if (zone === 'image_gallery') {
      const col = count % 4;
      const row = Math.floor(count / 4);
      position = [-11.6, 4.0 - row * 2.1, -8.0 + col * 3.2];
      rotation = [0, Math.PI / 2, 0];
      scale = [2.6, 1.8, 0.12];
    } else if (zone === 'video_theater') {
      position = [11.6, 3.4, 2.0 + count * 2.5];
      rotation = [0, -Math.PI / 2, 0];
      scale = [3.2, 2.0, 0.12];
    } else if (zone === 'game_zone') {
      const col = count % 4;
      const row = Math.floor(count / 4);
      position = [11.6, 4.0 - row * 2.1, -8.0 + col * 3.2];
      rotation = [0, -Math.PI / 2, 0];
      scale = [2.6, 1.8, 0.12];
    } else if (zone === 'resource_library') {
      position = [-9.0 + count * 3.0, 3.0, 11.6];
      rotation = [0, Math.PI, 0];
      scale = [2.6, 1.8, 0.12];
    }

    const newFrame: ClassroomFrame = {
      id: frameId,
      zone,
      type,
      title: title.trim() || `${ZONE_CONFIGS[zone].shortName} mới #${count + 1}`,
      slotIndex: count,
      position,
      rotation,
      scale,
      content: {}, // strictly empty initially!
      isCustomAdded: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAddFrame(newFrame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Thêm Khung 3D Mới</h2>
              <p className="text-xs text-slate-400">Khung sẽ xuất hiện trực tiếp trong không gian lớp học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zone Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Chọn khu vực trong phòng học:
          </label>
          <div className="space-y-1.5">
            {zoneOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setZone(opt.id);
                  if (opt.id === 'image_gallery') setType('image');
                  else if (opt.id === 'video_theater') setType('video');
                  else if (opt.id === 'game_zone') setType('game');
                  else setType('resource');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  zone === opt.id
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg" style={{ backgroundColor: `${opt.color}25`, color: opt.color }}>
                    {opt.icon}
                  </span>
                  <span>{opt.name}</span>
                </div>
                {zone === opt.id && (
                  <span className="text-xs text-sky-400 font-bold">Đã chọn</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Tiêu đề khung hiển thị:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Bài học Khám phá Không gian, Trò chơi đố vui..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Tạo khung ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
