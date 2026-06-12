import React, { useState } from 'react';
import { Video, Play, Pause, Film, Sliders, Download, Sparkles } from 'lucide-react';

export default function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineTracks, setTimelineTracks] = useState([
    { id: 1, name: "Core Video Asset", type: "video", duration: "30s" },
    { id: 2, name: "AI Generated Voiceover", type: "audio", duration: "30s" },
    { id: 3, name: "Brand Logo Overlay", type: "overlay", duration: "05s" }
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-slate-800">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Film className="text-purple-600" /> AI Video Timeline Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Fine-tune your generated video clips and multi-track assets</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-purple-700 transition">
          <Download size={16} /> Export Master Render
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Player Component */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-4 flex flex-col justify-between aspect-video shadow-lg text-white">
          <div className="w-full flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden relative group">
            <video 
              className="w-full h-full object-contain"
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
              controls
            />
          </div>
        </div>

        {/* Adjustments Inspector Sidebar */}
        <div className="bg-white border p-6 rounded-xl shadow-sm flex flex-col gap-6">
          <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-sm">
            <Sliders size={16} className="text-purple-600" /> Layer Inspector Settings
          </h3>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Aspect Ratio Overrides</label>
            <div className="grid grid-cols-3 gap-2">
              {['9:16 Shorts', '16:9 Wide', '1:1 Square'].map((ratio) => (
                <button key={ratio} className="border text-xs py-2 rounded-lg hover:bg-slate-50 text-center font-medium">
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">AI Subtitle Presets</label>
            <select className="w-full border p-2 rounded-lg text-sm bg-slate-50">
              <option>Dynamic Kinetic Pop (Bold Yellow)</option>
              <option>Minimalist Clean Bottom (White/Black)</option>
              <option>No Captions / Raw Pass-through</option>
            </select>
          </div>
        </div>

        {/* Multitrack Timeline Canvas */}
        <div className="lg:col-span-3 bg-slate-50 border p-6 rounded-xl shadow-inner">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Sparkles size={14} /> Synchronized Generation Tracks
          </h4>
          <div className="flex flex-col gap-2">
            {timelineTracks.map((track) => (
              <div key={track.id} className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {track.name} <span className="text-xs text-slate-400 font-normal">({track.type})</span>
                </span>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}