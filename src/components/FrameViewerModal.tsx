import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Volume2,
  VolumeX,
  AlertCircle,
  Gamepad2,
  FileText,
  RotateCcw,
  Sliders,
  Eraser,
  Plus
} from 'lucide-react';
import { ClassroomFrame } from '../types/classroom';
import { ZONE_CONFIGS } from '../data/defaultClassroom';
import { soundService } from '../services/audioService';

interface FrameViewerModalProps {
  frame: ClassroomFrame;
  onClose: () => void;
  onEditIfTeacher?: () => void;
  onClearContentIfTeacher?: () => void;
  isTeacher: boolean;
}

export const FrameViewerModal: React.FC<FrameViewerModalProps> = ({
  frame,
  onClose,
  onEditIfTeacher,
  onClearContentIfTeacher,
  isTeacher,
}) => {
  const zoneCfg = ZONE_CONFIGS[frame.zone] || ZONE_CONFIGS.smart_board;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { imageUrl, videoUrl, embedCode, docUrl } = frame.content;
  const hasContent = Boolean(imageUrl || videoUrl || embedCode || docUrl);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleReloadGame = () => {
    soundService.playClick();
    setIframeKey(k => k + 1);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-3 sm:p-6'} bg-slate-950/85 backdrop-blur-md transition-all`}>
      <div
        className={`relative w-full ${
          isFullscreen ? 'h-full rounded-none' : 'max-w-5xl h-[88vh] rounded-3xl'
        } bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-md"
              style={{ backgroundColor: zoneCfg.color }}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                {frame.title}
              </h2>
              <span className="text-xs text-sky-400 font-medium">
                {zoneCfg.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {embedCode && (
              <button
                onClick={handleReloadGame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all"
                title="Khởi động lại trò chơi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chơi lại</span>
              </button>
            )}

            {isTeacher && onEditIfTeacher && (
              <button
                onClick={onEditIfTeacher}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold cursor-pointer transition-all"
                title="Sửa nội dung khung"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Sửa nội dung</span>
              </button>
            )}

            {isTeacher && hasContent && onClearContentIfTeacher && (
              <>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer transition-all"
                    title="Xóa nội dung, làm trống khung"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xóa nội dung</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-amber-950/60 p-1 rounded-xl border border-amber-500/40">
                    <button
                      onClick={() => {
                        setShowClearConfirm(false);
                        onClearContentIfTeacher();
                      }}
                      className="px-2 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-1.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Content Area */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* 1. IMAGE DISPLAY */}
          {imageUrl && (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img
                src={imageUrl}
                alt={frame.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          )}

          {/* 2. VIDEO DISPLAY */}
          {videoUrl && !imageUrl && (
            <div className="w-full h-full flex items-center justify-center bg-black">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    videoUrl.includes('embed')
                      ? videoUrl
                      : `https://www.youtube.com/embed/${videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop()}`
                  }
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                  title={frame.title}
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )}

          {/* 3. GAME / INTERACTIVE EMBED DISPLAY */}
          {embedCode && !imageUrl && !videoUrl && (
            <div className="w-full h-full flex flex-col bg-slate-950">
              <iframe
                key={iframeKey}
                srcDoc={embedCode.includes('<iframe') ? undefined : embedCode}
                src={embedCode.includes('http') && !embedCode.includes('<iframe') ? embedCode : undefined}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="fullscreen; autoplay; gamepad"
                className="w-full h-full border-0 bg-white"
                title={frame.title}
              />
            </div>
          )}

          {/* 4. DOCUMENT / RESOURCE LINK */}
          {docUrl && !imageUrl && !videoUrl && !embedCode && (
            <div className="p-8 text-center max-w-lg space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">{frame.title}</h3>
              <p className="text-sm text-slate-400">
                Tài liệu học tập được chia sẻ bởi giáo viên. Nhấn vào nút bên dưới để mở liên kết trong tab mới:
              </p>
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <span>Mở tài liệu học tập</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 5. EMPTY STATE (No Content) */}
          {!hasContent && (
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto shadow-md">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Khung đang trống</h3>
              <p className="text-xs text-slate-400">
                {isTeacher
                  ? 'Khung này chưa có nội dung. Bạn có thể nhấn nút "Thêm nội dung" bên dưới để tải ảnh, video hoặc dán mã nhúng trò chơi.'
                  : 'Thầy cô hiện chưa thêm bài học vào khung này. Em hãy quay lại sau hoặc khám phá các khu vực khác nhé!'}
              </p>
              {isTeacher && onEditIfTeacher && (
                <button
                  onClick={onEditIfTeacher}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm nội dung vào khung</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
