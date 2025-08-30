import React, { useState } from 'react';
import type { HighlightClip } from '../types';
import VideoPlayer from './VideoPlayer';
import { ArrowLeftIcon, ScissorsIcon, PlayIcon } from './icons';

interface HighlightViewerProps {
  mediaFile: File;
  clips: HighlightClip[];
  onBack: () => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const HighlightViewer: React.FC<HighlightViewerProps> = ({ mediaFile, clips, onBack }) => {
    const [playbackRange, setPlaybackRange] = useState<{ start: number; end: number } | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleClipPlay = (clip: HighlightClip, index: number) => {
        setPlaybackRange({ start: clip.start, end: clip.end });
        setActiveIndex(index);
    };

    const isClipActive = activeIndex !== null;

    return (
        <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 px-4 md:px-8 animate-fadeInUp">
            <div className="flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-start">
                    <button onClick={onBack} className="back-button">
                        <ArrowLeftIcon className="w-5 h-5"/>
                        Upload New File
                    </button>
                </div>
                <div className="w-full bg-black rounded-lg overflow-hidden relative shadow-2xl border border-white/10 video-player-bg flex-grow flex items-center justify-center">
                    <div className={`relative transition-all duration-300 ease-in-out ${isClipActive ? 'aspect-[9/16] h-full' : 'w-full h-full'}`}>
                        <VideoPlayer 
                            mediaFile={mediaFile} 
                            playbackRange={playbackRange}
                            forceAspectRatio={isClipActive ? '9/16' : undefined}
                        />
                    </div>
                </div>
            </div>

            <div className="ui-panel flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <ScissorsIcon className="w-6 h-6 text-indigo-400"/>
                        <h2 className="text-xl font-bold">Generated Highlight Reels</h2>
                    </div>
                     <p className="text-sm text-gray-400 mt-1">The AI has found {clips.length} potential clips from your video.</p>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {clips.map((clip, index) => (
                        <div 
                            key={index}
                            className={`p-4 rounded-lg transition-all duration-200 cursor-pointer border-2 ${activeIndex === index ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                            onClick={() => handleClipPlay(clip, index)}
                        >
                            <div className="flex justify-between items-start">
                                <div className='flex-grow pr-4'>
                                    <p className="font-semibold text-white">{clip.title}</p>
                                    <p className="text-sm text-gray-400 mt-1">{clip.description}</p>
                                </div>
                                <div className="flex-shrink-0 text-xs font-mono bg-black/30 text-indigo-300 px-2 py-1 rounded-md">
                                    {formatTime(clip.start)} - {formatTime(clip.end)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                 <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-800/50">
                     <button onClick={() => alert('Feature coming soon!')} className="action-button btn-tertiary">
                        <PlayIcon className="w-5 h-5" />
                        Export All Clips
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HighlightViewer;
