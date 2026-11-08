import React from 'react';
import { X, Mouse, Keyboard, Glasses, Hand, Sparkles } from 'lucide-react';

interface ControlsHelpModalProps {
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Hướng Dẫn Điều Khiển 3D VR</h2>
              <p className="text-xs text-slate-400">Cách di chuyển và tương tác trong phòng học ảo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm">
          {/* Mouse Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
              <Mouse className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white">Chuột máy tính</h4>
              <p className="text-slate-300">
                • <strong>Kéo chuột trái:</strong> Xoay góc nhìn xung quanh phòng học.
              </p>
              <p className="text-slate-300">
                • <strong>Con lăn chuột:</strong> Phóng to / thu nhỏ góc nhìn.
              </p>
              <p className="text-slate-300">
                • <strong>Nhấn chuột trái vào màn hình 3D:</strong> Chọn và mở tương tác nội dung.
              </p>
            </div>
          </div>

          {/* Keyboard Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white">Bàn phím (Đi lại trong phòng)</h4>
              <p className="text-slate-300">
                • <strong>W / A / S / D hoặc Phím mũi tên:</strong> Bước đi tới, lui, trái, phải trong lớp học.
              </p>
              <p className="text-slate-300">
                • <strong>Phím H:</strong> Ẩn / hiện thanh điều khiển bên dưới (Chế độ ngắm toàn cảnh).
              </p>
            </div>
          </div>

          {/* Touch Screen */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
              <Hand className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white">Màn hình cảm ứng (iPad, Tablet, Laptop cảm ứng)</h4>
              <p className="text-slate-300">
                • <strong>Chạm và vuốt một ngón tay:</strong> Xoay góc nhìn 3D.
              </p>
              <p className="text-slate-300">
                • <strong>Chụm / mở 2 ngón tay:</strong> Phóng to / thu nhỏ.
              </p>
              <p className="text-slate-300">
                • <strong>Chạm vào màn hình:</strong> Mở học liệu.
              </p>
            </div>
          </div>

          {/* VR Headset */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0 mt-0.5">
              <Glasses className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white">Kính Thực Tế Ảo VR (WebXR)</h4>
              <p className="text-slate-300">
                Nhấn nút <strong>"VR 3D"</strong> ở góc trên bên phải để vào chế độ thực tế ảo không gian với kính VR tương thích.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-sky-500/25"
          >
            Đã hiểu, bắt đầu khám phá!
          </button>
        </div>
      </div>
    </div>
  );
};
