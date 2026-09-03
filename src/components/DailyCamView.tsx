import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, Calendar, Image as ImageIcon, EyeOff, ShieldAlert, SwitchCamera } from 'lucide-react';
import { DailyCamEntry } from '../types';

interface DailyCamViewProps {
  entries: DailyCamEntry[];
  onSavePhoto: (photoInput: Blob | string, dayNumber: number, note?: string) => Promise<void>;
  onDeletePhoto?: (id: string, fileId?: string) => Promise<void>;
  isLoading?: boolean;
}

export const DailyCamView: React.FC<DailyCamViewProps> = ({
  entries,
  onSavePhoto,
  isLoading = false,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Statistics
  const totalPhotos = entries.length;
  const sortedEntries = [...entries].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
  
  // Calculate active days
  const uniqueDays = new Set(
    entries.map(e => {
      if (!e.timestamp) return '';
      return new Date(e.timestamp).toDateString();
    }).filter(Boolean)
  ).size;

  const currentDayNumber = sortedEntries.length > 0
    ? Math.max(...sortedEntries.map(e => e.day_number || 0)) + 1
    : 1;

  // Check if user already took a photo today
  const todayStr = new Date().toDateString();
  const hasTakenPhotoToday = entries.some(e => {
    if (!e.timestamp) return false;
    return new Date(e.timestamp).toDateString() === todayStr;
  });

  const firstEntry = sortedEntries.length > 0 ? sortedEntries[0] : null;
  const lastEntry = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1] : null;

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('getUserMedia error, falling back to file input:', err);
      setCameraError('Kamera langsung tidak tersedia. Anda dapat menggunakan kamera perangkat/unggah.');
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isCameraOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOpen, capturedImage, startCamera, stopCamera]);

  // Capture photo from video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror selfie
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // Handle fallback file upload / camera capture from native input
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setIsCameraOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  // Cancel & close
  const handleCancelCamera = () => {
    stopCamera();
    setCapturedImage(null);
    setPhotoNote('');
    setIsCameraOpen(false);
  };

  // Save photo
  const handleSave = async () => {
    if (!capturedImage) return;
    setIsSaving(true);
    try {
      await onSavePhoto(capturedImage, currentDayNumber, photoNote.trim());
      handleCancelCamera();
    } catch (err) {
      console.error('Save photo error:', err);
      alert('Gagal menyimpan foto. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="space-y-4 px-4 py-4 pb-20">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-blue-100 flex items-center gap-1.5 border border-white/15">
              <Camera size={13} className="text-blue-200" />
              DailyCam Tracking
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${hasTakenPhotoToday ? 'bg-emerald-500/80 text-white' : 'bg-amber-400/80 text-amber-950'}`}>
              {hasTakenPhotoToday ? '✓ Hari Ini Selesai' : 'Belum Ada Foto Hari Ini'}
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Day {hasTakenPhotoToday ? (sortedEntries[sortedEntries.length - 1]?.day_number || currentDayNumber - 1) : currentDayNumber}
            </h2>
            <p className="text-xs text-blue-100/90 mt-0.5">
              {hasTakenPhotoToday
                ? 'Hebat! Anda telah mengabadikan foto hari ini. Ambil foto berikutnya besok!'
                : 'Abadikan satu foto hari ini untuk melanjutkan streak harian Anda.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Total Hari Aktif */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Total Hari Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {uniqueDays} <span className="text-xs font-normal text-slate-600">Hari</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">Hari unik terekam</p>
          </div>
        </div>

        {/* Metric 2: Total Foto Tersimpan */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Total Foto</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ImageIcon size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {totalPhotos} <span className="text-xs font-normal text-slate-600">Foto</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">Tersimpan di Cloud</p>
          </div>
        </div>
      </div>

      {/* Blind Result Feature Notice */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <EyeOff size={16} />
        </div>
        <div>
          <h4 className="font-bold text-blue-950 text-sm">Mode Blind Result</h4>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed text-[11px]">
            Foto harian Anda disimpan dengan aman di cloud tanpa galeri terbuka agar tidak terdistraksi hasil harian. Satu hari dibatasi 1 foto untuk menjaga konsistensi harian.
          </p>
        </div>
      </div>

      {/* Main Action: Ambil Foto */}
      <div className="space-y-2 pt-2">
        {hasTakenPhotoToday ? (
          <div className="w-full py-4 px-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm shadow-xs flex items-center justify-center gap-2.5 cursor-not-allowed">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Check size={14} />
            </div>
            <span>Foto Hari Ini Selesai</span>
          </div>
        ) : (
          <button
            onClick={() => setIsCameraOpen(true)}
            disabled={isLoading || hasTakenPhotoToday}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-base shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Camera size={22} className="animate-pulse" />
            <span>Ambil Foto Hari Ini (Day {currentDayNumber})</span>
          </button>
        )}
        {hasTakenPhotoToday && (
          <p className="text-[11px] text-center text-slate-500">
            Anda sudah mengambil foto hari ini. Kamera akan terbuka kembali besok.
          </p>
        )}
      </div>

      {/* Hidden Native File Picker for fallback camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* ============================================================ */}
      {/* MODAL: LIVE CAMERA & PHOTO CAPTURE / PREVIEW                 */}
      {/* ============================================================ */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 animate-in fade-in duration-200">
          {/* Header Modal */}
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                Day {currentDayNumber}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {capturedImage ? 'Pratinjau Foto' : 'Kamera DailyCam'}
              </span>
            </div>

            <button
              onClick={handleCancelCamera}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Viewfinder or Captured Preview */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl bg-slate-950 border border-white/10">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Preview"
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center text-white max-w-xs space-y-3">
                    <ShieldAlert size={40} className="mx-auto text-amber-400" />
                    <p className="text-xs text-slate-300">{cameraError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Buka Kamera Perangkat
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover rounded-2xl ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    {/* Viewfinder crosshair overlay */}
                    <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-white absolute top-0 left-0" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-white absolute top-0 right-0" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-white absolute bottom-0 left-0" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-white absolute bottom-0 right-0" />
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    </div>

                    {/* Switch camera button */}
                    <button
                      onClick={toggleCameraFacing}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 border border-white/20 cursor-pointer"
                      title="Ganti Kamera Depan/Belakang"
                    >
                      <SwitchCamera size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="z-10">
            {capturedImage ? (
              <div className="space-y-3">
                {/* Optional Note input */}
                <input
                  type="text"
                  value={photoNote}
                  onChange={e => setPhotoNote(e.target.value)}
                  placeholder="Catatan hari ini (opsional, misal: Berat 68kg)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* 3 Buttons: Retake, Batal, Simpan */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleRetake}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw size={15} />
                    <span>Ambil Ulang</span>
                  </button>

                  <button
                    onClick={handleCancelCamera}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X size={15} />
                    <span>Batal</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/40 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-around py-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                  title="Pilih dari Galeri/Kamera"
                >
                  <ImageIcon size={20} />
                </button>

                {/* Shutter Button */}
                <button
                  onClick={handleSnapPhoto}
                  className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform bg-transparent cursor-pointer"
                >
                  <div className="w-full h-full rounded-full bg-white hover:bg-blue-100 transition-colors shadow-lg" />
                </button>

                <button
                  onClick={handleCancelCamera}
                  className="p-3 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
