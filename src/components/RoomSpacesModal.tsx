import React, { useState } from 'react';
import {
  X,
  Plus,
  Sparkles,
  TreePine,
  Rocket,
  BookOpen,
  Check,
  Trash2,
  Edit2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ClassroomSpace, ClassroomTheme } from '../types/classroom';
import { THEME_CONFIGS, createDefaultFramesForSpace } from '../data/defaultClassroom';
import { soundService } from '../services/audioService';

interface RoomSpacesModalProps {
  spaces: ClassroomSpace[];
  activeSpaceId: string;
  onSelectSpace: (spaceId: string) => void;
  onAddSpace: (newSpace: ClassroomSpace) => void;
  onUpdateSpace: (updatedSpace: ClassroomSpace) => void;
  onDeleteSpace: (spaceId: string) => void;
  onClose: () => void;
  isTeacher: boolean;
}

export const RoomSpacesModal: React.FC<RoomSpacesModalProps> = ({
  spaces,
  activeSpaceId,
  onSelectSpace,
  onAddSpace,
  onUpdateSpace,
  onDeleteSpace,
  onClose,
  isTeacher,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // New room state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTheme, setNewTheme] = useState<ClassroomTheme>('future_blue');
  const [newBanner, setNewBanner] = useState('');

  // Editing existing room
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTheme, setEditTheme] = useState<ClassroomTheme>('future_blue');
  const [editBanner, setEditBanner] = useState('');

  const themeList: { id: ClassroomTheme; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'future_blue',
      name: 'Công Nghệ Tương Lai',
      desc: 'Xanh lam dịu & trắng tinh khôi, ánh sáng LED hiện đại',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      color: '#38bdf8',
    },
    {
      id: 'nature_green',
      name: 'Thiên Nhiên Sinh Thái',
      desc: 'Xanh lá tươi mát & hoa cỏ ngập tràn ánh nắng',
      icon: <TreePine className="w-5 h-5 text-emerald-400" />,
      color: '#10b981',
    },
    {
      id: 'cosmic_space',
      name: 'Khám Phá Vũ Trụ',
      desc: 'Bầu trời đêm huyền bí, dải ngân hà và các hành tinh',
      icon: <Rocket className="w-5 h-5 text-purple-400" />,
      color: '#8b5cf6',
    },
    {
      id: 'warm_wood',
      name: 'Thư Viện Gỗ Ấm Áp',
      desc: 'Tông gỗ sồi cổ điển, ấm cúng và gần gũi',
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      color: '#f59e0b',
    },
  ];

  const handleCreateSpace = () => {
    soundService.playSuccess();
    const spaceId = `space-${Date.now()}`;
    const name = newName.trim() || `Phòng học ${spaces.length + 1}`;
    const banner = newBanner.trim() || name.toUpperCase();

    const newSpace: ClassroomSpace = {
      id: spaceId,
      name,
      description: newDesc.trim() || 'Không gian học tập ảo 3D tương tác',
      theme: newTheme,
      bannerText: banner,
      frames: createDefaultFramesForSpace(spaceId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAddSpace(newSpace);
    onSelectSpace(newSpace.id);
    onClose();
  };

  const startEdit = (sp: ClassroomSpace) => {
    setEditingSpaceId(sp.id);
    setEditName(sp.name);
    setEditDesc(sp.description);
    setEditTheme(sp.theme);
    setEditBanner(sp.bannerText);
  };

  const handleSaveEdit = (sp: ClassroomSpace) => {
    soundService.playSuccess();
    const updated: ClassroomSpace = {
      ...sp,
      name: editName.trim() || sp.name,
      description: editDesc.trim() || sp.description,
      theme: editTheme,
      bannerText: editBanner.trim() || sp.bannerText,
      updatedAt: Date.now(),
    };
    onUpdateSpace(updated);
    setEditingSpaceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md">
              <Layers className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Không Gian Phòng Học Ảo 3D
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý và chuyển đổi các phòng học ảo theo chủ đề giảng dạy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'list'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Danh sách phòng học ({spaces.length})
          </button>

          {isTeacher && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all ${
                activeTab === 'create'
                  ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm phòng học ảo mới</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'list' && (
            <div className="space-y-3">
              {spaces.map((sp) => {
                const isCurrent = sp.id === activeSpaceId;
                const themeCfg = THEME_CONFIGS[sp.theme] || THEME_CONFIGS.future_blue;
                const isEditing = editingSpaceId === sp.id;
                const populatedCount = sp.frames.filter(
                  f => f.content.imageUrl || f.content.videoUrl || f.content.embedCode || f.content.docUrl
                ).length;

                if (isEditing) {
                  return (
                    <div key={sp.id} className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/50 space-y-3">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Chỉnh sửa phòng học</h4>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Tên phòng học"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Mô tả phòng học"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <input
                        type="text"
                        value={editBanner}
                        onChange={(e) => setEditBanner(e.target.value)}
                        placeholder="Khẩu hiệu trên biểu ngữ bảng 3D"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {themeList.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setEditTheme(t.id)}
                            className={`p-2 rounded-xl border text-left text-xs flex items-center gap-2 ${
                              editTheme === t.id ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {t.icon}
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingSpaceId(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSaveEdit(sp)}
                          className="px-4 py-1.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={sp.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-slate-950/80 border-sky-500/80 shadow-lg shadow-sky-950/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                        style={{ backgroundColor: `${themeCfg.primaryColor}20`, border: `1px solid ${themeCfg.primaryColor}40` }}
                      >
                        {sp.theme === 'nature_green' ? (
                          <TreePine className="w-5 h-5 text-emerald-400" />
                        ) : sp.theme === 'cosmic_space' ? (
                          <Rocket className="w-5 h-5 text-purple-400" />
                        ) : sp.theme === 'warm_wood' ? (
                          <BookOpen className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-sky-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{sp.name}</h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold shrink-0">
                              Đang giảng dạy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{sp.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Chủ đề: <strong className="text-slate-300">{themeCfg.name}</strong></span>
                          <span>•</span>
                          <span>{sp.frames.length} khung ({populatedCount} bài học)</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isTeacher && (
                        <button
                          onClick={() => startEdit(sp)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer"
                          title="Đổi tên và chủ đề phòng"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isTeacher && spaces.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa phòng học "${sp.name}"?`)) {
                              soundService.playDelete();
                              onDeleteSpace(sp.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs cursor-pointer"
                          title="Xóa phòng học này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isCurrent ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Hiện tại</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            soundService.playSelect();
                            onSelectSpace(sp.id);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition-all cursor-pointer"
                        >
                          <span>Vào phòng</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CREATE NEW ROOM */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên phòng học ảo mới:
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Phòng học 4: Trải Nghiệm Toán Học, Lớp 5B..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mô tả ngắn phòng học:
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ví dụ: Không gian học tập tương tác số và trò chơi giải đố"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Khẩu hiệu trên biểu ngữ 3D lớp học:
                </label>
                <input
                  type="text"
                  value={newBanner}
                  onChange={(e) => setNewBanner(e.target.value)}
                  placeholder="Ví dụ: HỌC TẬP VUI VẺ – SÁNG TẠO MỖI NGÀY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Chọn chủ đề & phong cách không gian 3D:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewTheme(t.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        newTheme === t.id
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {t.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">{t.name}</p>
                          {newTheme === t.id && (
                            <Check className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateSpace}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Tạo không gian phòng học 3D ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
