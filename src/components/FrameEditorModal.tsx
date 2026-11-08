import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Gamepad2,
  BookOpen,
  Sliders,
  Trash2,
  Save,
  Maximize2,
  Link,
  Code,
  AlertCircle,
  CheckCircle2,
  Eraser,
  RefreshCw
} from 'lucide-react';
import { ClassroomFrame, FrameContentType } from '../types/classroom';
import { ZONE_CONFIGS } from '../data/defaultClassroom';
import { soundService } from '../services/audioService';

interface FrameEditorModalProps {
  frame: ClassroomFrame;
  onSave: (updatedFrame: ClassroomFrame) => void;
  onDelete: (frameId: string) => void;
  onClose: () => void;
  onOpenViewer: () => void;
}

export const FrameEditorModal: React.FC<FrameEditorModalProps> = ({
  frame,
  onSave,
  onDelete,
  onClose,
  onOpenViewer,
}) => {
  const zoneCfg = ZONE_CONFIGS[frame.zone] || ZONE_CONFIGS.smart_board;

  const [title, setTitle] = useState(frame.title);
  const [contentType, setContentType] = useState<FrameContentType>(frame.type);

  // Content state
  const [imageUrl, setImageUrl] = useState(frame.content.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(frame.content.videoUrl || '');
  const [embedCode, setEmbedCode] = useState(frame.content.embedCode || '');
  const [docUrl, setDocUrl] = useState(frame.content.docUrl || '');
  const [resourceType, setResourceType] = useState<'image' | 'video' | 'doc' | 'embed'>(frame.content.resourceType || 'image');

  // Transform state
  const [posX, setPosX] = useState(frame.position[0]);
  const [posY, setPosY] = useState(frame.position[1]);
  const [posZ, setPosZ] = useState(frame.position[2]);
  const [scaleW, setScaleW] = useState(frame.scale[0]);
  const [scaleH, setScaleH] = useState(frame.scale[1]);

  const [activeTab, setActiveTab] = useState<'content' | 'transform' | 'preview'>('content');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const hasAnyContent = Boolean(imageUrl || videoUrl || embedCode || docUrl);

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Compress large uploaded images so they save permanently without exceeding storage limits
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(format, 0.88);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // File upload handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Vui lòng chọn tệp hình ảnh định dạng JPG, PNG hoặc WEBP.');
      return;
    }
    setIsProcessingImage(true);
    try {
      const compressedDataUrl = await compressImage(file);
      if (compressedDataUrl) {
        setImageUrl(compressedDataUrl);
        soundService.playSuccess();
      }
    } catch {
      // fallback to direct read
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImageUrl(event.target.result);
          soundService.playSuccess();
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type)) {
      alert('Vui lòng chọn tệp video MP4 hoặc WEBM.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setVideoUrl(event.target.result);
        soundService.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear only content (make frame empty again)
  const handleClearContent = () => {
    soundService.playDelete();
    setImageUrl('');
    setVideoUrl('');
    setEmbedCode('');
    setDocUrl('');
    setShowClearConfirm(false);

    // Save immediately so 3D screen updates back to "+ Thêm nội dung"
    const emptied: ClassroomFrame = {
      ...frame,
      title: title.trim() || frame.title,
      type: contentType,
      position: [posX, posY, posZ],
      scale: [scaleW, scaleH, frame.scale[2]],
      content: {},
      updatedAt: Date.now(),
    };
    onSave(emptied);
  };

  // Save changes
  const handleSave = () => {
    soundService.playSuccess();

    // Reliably construct content payload
    const contentPayload: Record<string, string | undefined> = {};
    if (contentType === 'image' && imageUrl.trim()) {
      contentPayload.imageUrl = imageUrl.trim();
    } else if (contentType === 'video' && videoUrl.trim()) {
      contentPayload.videoUrl = videoUrl.trim();
    } else if (contentType === 'game' && embedCode.trim()) {
      contentPayload.embedCode = embedCode.trim();
    } else if (contentType === 'resource') {
      contentPayload.resourceType = resourceType;
      if (resourceType === 'image' && imageUrl.trim()) contentPayload.imageUrl = imageUrl.trim();
      else if (resourceType === 'video' && videoUrl.trim()) contentPayload.videoUrl = videoUrl.trim();
      else if (resourceType === 'embed' && embedCode.trim()) contentPayload.embedCode = embedCode.trim();
      else if (resourceType === 'doc' && docUrl.trim()) contentPayload.docUrl = docUrl.trim();
    }

    // Comprehensive fallback: preserve any non-empty fields the user added
    if (!contentPayload.imageUrl && imageUrl.trim()) contentPayload.imageUrl = imageUrl.trim();
    if (!contentPayload.videoUrl && videoUrl.trim()) contentPayload.videoUrl = videoUrl.trim();
    if (!contentPayload.embedCode && embedCode.trim()) contentPayload.embedCode = embedCode.trim();
    if (!contentPayload.docUrl && docUrl.trim()) contentPayload.docUrl = docUrl.trim();

    const updated: ClassroomFrame = {
      ...frame,
      title: title.trim() || frame.title,
      type: contentType,
      position: [posX, posY, posZ],
      scale: [scaleW, scaleH, frame.scale[2]],
      content: contentPayload,
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shadow-lg shrink-0"
              style={{ backgroundColor: zoneCfg.color }}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Quản lý nội dung: {frame.title}
              </h2>
              <p className="text-xs text-slate-400">
                Khu vực: <span className="font-semibold text-sky-400">{zoneCfg.name}</span>
                {hasAnyContent ? (
                  <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Đã có nội dung
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600/50">
                    Khung trống
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAnyContent && (
              <button
                onClick={onOpenViewer}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 transition-all cursor-pointer flex items-center gap-1 text-xs"
                title="Xem trên toàn màn hình"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'content'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Thêm & Sửa nội dung
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'preview'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Xem trước
          </button>
          <button
            onClick={() => setActiveTab('transform')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === 'transform'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vị trí & Kích thước 3D
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: CONTENT EDITING / ADDING */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên tiêu đề khung:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
                  placeholder="Nhập tên tiêu đề khung hiển thị..."
                />
              </div>

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Loại nội dung hiển thị:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('image')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      contentType === 'image'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('video')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      contentType === 'video'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('game')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      contentType === 'game'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Trò chơi nhúng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('resource')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      contentType === 'resource'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Học liệu số</span>
                  </button>
                </div>
              </div>

              {/* SPECIFIC INPUT BY TYPE */}
              {/* 1. IMAGE */}
              {contentType === 'image' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Tải ảnh từ máy tính (JPG, PNG, WEBP):</span>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ảnh này</span>
                      </button>
                    )}
                  </div>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-pink-400 rounded-2xl cursor-pointer bg-slate-900/60 transition-all">
                    <Upload className="w-8 h-8 text-pink-400 mb-2" />
                    <span className="text-sm font-semibold text-white">Bấm để chọn tệp hình ảnh từ máy tính</span>
                    <span className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP độ phân giải cao</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-xs text-slate-400">hoặc</div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Đường dẫn hình ảnh trực tiếp (URL):</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  {imageUrl && (
                    <div className="mt-2 p-2 bg-slate-900/80 rounded-xl border border-pink-500/30 flex items-center gap-3">
                      <img src={imageUrl} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">Ảnh đang sẵn sàng</p>
                        <p className="text-[10px] text-pink-300">Nhấn "Lưu thay đổi" để áp dụng lên màn hình 3D</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. VIDEO */}
              {contentType === 'video' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Tải video từ máy tính (MP4, WEBM):</span>
                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa video này</span>
                      </button>
                    )}
                  </div>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl cursor-pointer bg-slate-900/60 transition-all">
                    <Film className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-sm font-semibold text-white">Bấm để chọn tệp video từ máy tính</span>
                    <span className="text-xs text-slate-400 mt-1">Hỗ trợ video MP4 hoặc WEBM</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-xs text-slate-400">hoặc</div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Đường dẫn video trực tiếp hoặc YouTube embed:</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://... hoặc URL video MP4 / YouTube"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* 3. GAME EMBED */}
              {contentType === 'game' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300">Mã nhúng HTML / iframe trò chơi:</span>
                    </div>
                    {embedCode && (
                      <button
                        type="button"
                        onClick={() => setEmbedCode('')}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa mã nhúng</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Dán mã nhúng iframe hoặc HTML trò chơi từ Gemini AI, Google AI Studio, Wordwall, Kahoot, Scratch hoặc trang web tương tác:
                  </p>

                  <textarea
                    rows={6}
                    value={embedCode}
                    onChange={(e) => setEmbedCode(e.target.value)}
                    placeholder='<iframe src="https://..." width="100%" height="500" allow="fullscreen"></iframe>'
                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />

                  <div className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Mã nhúng được bảo vệ an toàn trong môi trường sandbox biệt lập, học sinh có thể chơi trực tiếp.</span>
                  </div>
                </div>
              )}

              {/* 4. DIGITAL RESOURCE */}
              {contentType === 'resource' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-slate-300 font-semibold">Hình thức học liệu:</label>
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value as 'image' | 'video' | 'doc' | 'embed')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-purple-300 focus:outline-none"
                    >
                      <option value="doc">Tài liệu / Liên kết bài giảng</option>
                      <option value="image">Hình ảnh minh họa</option>
                      <option value="video">Video bài học</option>
                      <option value="embed">Mã nhúng tương tác</option>
                    </select>
                  </div>

                  {resourceType === 'doc' && (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Đường dẫn tài liệu (Google Docs, Slides, PDF, Web):</label>
                      <input
                        type="url"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://docs.google.com/... hoặc liên kết tài liệu"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  )}

                  {resourceType === 'image' && (
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-purple-400 rounded-xl cursor-pointer bg-slate-900/60">
                      <Upload className="w-6 h-6 text-purple-400 mb-1" />
                      <span className="text-xs font-semibold text-white">Chọn tệp hình ảnh học liệu</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {resourceType === 'embed' && (
                    <textarea
                      rows={5}
                      value={embedCode}
                      onChange={(e) => setEmbedCode(e.target.value)}
                      placeholder='<iframe src="..."></iframe>'
                      className="w-full font-mono text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-purple-300 focus:outline-none"
                    />
                  )}
                </div>
              )}

              {/* Clear Content Action Box */}
              {hasAnyContent && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Eraser className="w-4 h-4" />
                      <span>Xóa nội dung trong khung (Làm trống khung)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Xóa sạch tệp và đưa khung về trạng thái "+ Thêm nội dung" ban đầu mà vẫn giữ khung 3D trong lớp học.
                    </p>
                  </div>

                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Làm trống
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleClearContent}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                      >
                        Xác nhận
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                {imageUrl && contentType === 'image' && (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                )}

                {videoUrl && contentType === 'video' && (
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                )}

                {embedCode && contentType === 'game' && (
                  <iframe
                    srcDoc={embedCode.includes('<iframe') ? undefined : embedCode}
                    src={embedCode.includes('http') && !embedCode.includes('<iframe') ? embedCode : undefined}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    className="w-full h-full border-0"
                    title="Game Preview"
                  />
                )}

                {!hasAnyContent && (
                  <div className="text-center p-6 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">Khung đang ở trạng thái trống</p>
                    <p className="text-xs text-slate-500">
                      Chưa có nội dung. Chọn tab "Thêm & Sửa nội dung" để thêm hình ảnh, video hoặc mã trò chơi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFORM / 3D POSITION */}
          {activeTab === 'transform' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Điều chỉnh vị trí và kích thước của khung trong không gian lớp học 3D:
              </p>

              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Vị trí Ngang (Trục X):</span>
                    <span className="font-mono text-sky-400">{posX.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={-11.8}
                    max={11.8}
                    step={0.1}
                    value={posX}
                    onChange={(e) => setPosX(parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chiều cao so với sàn (Trục Y):</span>
                    <span className="font-mono text-sky-400">{posY.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    value={posY}
                    onChange={(e) => setPosY(parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Vị trí Sâu / Trước - Sau (Trục Z):</span>
                    <span className="font-mono text-sky-400">{posZ.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={-11.8}
                    max={11.8}
                    step={0.1}
                    value={posZ}
                    onChange={(e) => setPosZ(parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chiều rộng khung:</span>
                    <span className="font-mono text-sky-400">{scaleW.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={1.2}
                    max={9.0}
                    step={0.1}
                    value={scaleW}
                    onChange={(e) => setScaleW(parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chiều cao khung:</span>
                    <span className="font-mono text-sky-400">{scaleH.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={6.0}
                    step={0.1}
                    value={scaleH}
                    onChange={(e) => setScaleH(parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all cursor-pointer"
                title="Xóa hoàn toàn khung này khỏi lớp học 3D"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa khung 3D</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400 font-semibold">Xóa khỏi phòng học?</span>
                <button
                  type="button"
                  onClick={() => {
                    soundService.playDelete();
                    onDelete(frame.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white cursor-pointer"
                >
                  Xóa khung
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
