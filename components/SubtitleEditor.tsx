import React, { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Subtitle, StyleOptions, SrtExportOptions } from '../types';
import VideoPlayer from './VideoPlayer';
import StyleControls from './StyleControls';
import SubtitleTimeline from './SubtitleTimeline';
import ExportModal from './ExportModal';
import { exportToSRT, exportToVTT } from '../services/subtitleService';
import { ArrowLeftIcon, DownloadIcon, VideoIcon } from './icons';

interface SubtitleEditorProps {
  mediaFile: File;
  subtitles: Subtitle[];
  setSubtitles: Dispatch<SetStateAction<Subtitle[] | null>>;
  styleOptions: StyleOptions;
  setStyleOptions: Dispatch<SetStateAction<StyleOptions>>;
  onBack: () => void;
}

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  mediaFile,
  subtitles,
  setSubtitles,
  styleOptions,
  setStyleOptions,
  onBack
}) => {
  const [isSrtModalOpen, setIsSrtModalOpen] = useState(false);
  const [srtExportOptions, setSrtExportOptions] = useState<SrtExportOptions>({
    type: 'lines',
    maxCharsPerLine: 42,
    maxLinesPerCard: 2,
  });
  const [activeTab, setActiveTab] = useState<'style' | 'timeline'>('style');
  
  const isWordAnimationAvailable = subtitles.length > 0 && !!subtitles[0].words && subtitles[0].words.length > 0;
  
  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSrtExport = () => {
    const content = exportToSRT(subtitles, srtExportOptions);
    const fileName = `${mediaFile.name.split('.').slice(0, -1).join('.')}.srt`;
    downloadFile(content, fileName);
    setIsSrtModalOpen(false);
  };
  
  const handleVttExport = () => {
    const content = exportToVTT(subtitles);
    const fileName = `${mediaFile.name.split('.').slice(0, -1).join('.')}.vtt`;
    downloadFile(content, fileName);
  };
  
  const handleUpdateSubtitle = (index: number, newText: string) => {
    if (!subtitles) return;
    const newSubtitles = [...subtitles];
    const updatedSubtitle = { ...newSubtitles[index] };
    
    updatedSubtitle.text = newText;
    // Invalidate word-level timestamps since they no longer match the text.
    // This gracefully disables word-by-word animation for this specific line.
    updatedSubtitle.words = [];
    
    newSubtitles[index] = updatedSubtitle;
    setSubtitles(newSubtitles);
  };

  const handleBurnedInExport = () => {
    console.log("Simulating burned-in video export with options:", styleOptions);
    alert("In a production application, this would trigger a server-side rendering job using a tool like FFmpeg to burn the styled subtitles into the video. This is a mock action for the demo.");
  };

  return (
    <>
      <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 px-4 md:px-8 animate-fadeInUp">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-start">
              <button onClick={onBack} className="back-button">
                  <ArrowLeftIcon className="w-5 h-5"/>
                  Upload New File
              </button>
          </div>
          {/* The video player container now grows to fill available space and centers the video */}
          <div className="w-full bg-black rounded-lg overflow-hidden relative shadow-2xl border border-white/10 video-player-bg flex-grow flex items-center justify-center">
            <VideoPlayer 
              mediaFile={mediaFile} 
              subtitles={subtitles} 
              styleOptions={styleOptions}
            />
          </div>
        </div>
        <div className="ui-panel flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
          <div className="flex-shrink-0 p-3">
            <div className="tab-container">
                <div 
                  className="tab-slider"
                  style={{
                      width: 'calc(50% - 4px)',
                      transform: activeTab === 'timeline' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                  }}
                />
                <button 
                  onClick={() => setActiveTab('style')}
                  className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
                  aria-pressed={activeTab === 'style'}
                >
                  Style
                </button>
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
                  aria-pressed={activeTab === 'timeline'}
                >
                  Timeline
                </button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {activeTab === 'style' ? (
              <StyleControls 
                options={styleOptions} 
                setOptions={setStyleOptions}
                isWordAnimationAvailable={isWordAnimationAvailable}
              />
            ) : (
              <SubtitleTimeline subtitles={subtitles} onUpdateSubtitle={handleUpdateSubtitle} />
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-800/50 space-y-3">
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setIsSrtModalOpen(true)} className="action-button btn-secondary">
                    <DownloadIcon className="w-5 h-5" />
                    Export SRT
                 </button>
                 <button onClick={handleVttExport} className="action-button btn-secondary">
                    <DownloadIcon className="w-5 h-5" />
                    Export VTT
                 </button>
             </div>
              <button onClick={handleBurnedInExport} className="action-button btn-primary">
                  <VideoIcon className="w-5 h-5" />
                  Export Burned-in Video
              </button>
          </div>
        </div>
      </div>
      <ExportModal 
        isOpen={isSrtModalOpen}
        onClose={() => setIsSrtModalOpen(false)}
        onConfirm={handleSrtExport}
        exportOptions={srtExportOptions}
        setExportOptions={setSrtExportOptions}
        isWordLevelAvailable={isWordAnimationAvailable}
      />
    </>
  );
};

export default SubtitleEditor;