import React, { useCallback, useState } from 'react';
import { UploadIcon, Bars3BottomLeftIcon, PlayIcon, SparklesIcon, EmojiHappyIcon, FilmIcon, DocumentTextIcon, ScissorsIcon, ChatBubbleBottomCenterTextIcon, LinkIcon, DocumentArrowUpIcon } from './icons';
import { StylePreset, ProcessMode } from '../types';

interface VideoUploadProps {
  onUpload: (file: File, targetLanguage: string, stylePreset: StylePreset, processMode: ProcessMode) => void;
  onUrlSubmit: (url: string) => void;
  error?: string | null;
}

const languageOptions = [
  { value: 'original', label: 'Original Language' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
  { value: 'Hindi', label: 'Hindi' },
];

const presetOptions = [
    { id: StylePreset.STANDARD, icon: Bars3BottomLeftIcon, title: 'Standard', description: 'Classic subtitles with word-level timing.' },
    { id: StylePreset.TIKTOK, icon: PlayIcon, title: 'TikTok Style', description: 'Short, punchy lines for social media.' },
    { id: StylePreset.KEYWORDS, icon: SparklesIcon, title: 'Keyword Highlight', description: 'AI automatically bolds important words.' },
    { id: StylePreset.EMOJIS, icon: EmojiHappyIcon, title: 'Emoji Injection', description: 'AI adds relevant emojis to each line.' },
    { id: StylePreset.MINIMALIST, icon: DocumentTextIcon, title: 'Minimalist', description: 'Clean, simple text with no effects.' },
    { id: StylePreset.BOLD_OUTLINE, icon: ChatBubbleBottomCenterTextIcon, title: 'Bold Outline', description: 'Large, outlined text for high visibility.' },
    { id: StylePreset.POP_3D, icon: SparklesIcon, title: '3D Pop', description: 'Text with a sharp shadow for a 3D effect.' },
];

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload, onUrlSubmit, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('original');
  const [stylePreset, setStylePreset] = useState<StylePreset>(StylePreset.STANDARD);
  const [processMode, setProcessMode] = useState<ProcessMode>(ProcessMode.SUBTITLES);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [videoUrl, setVideoUrl] = useState('');

  const handleFileSelect = (file: File | null | undefined) => {
    if (file) {
      onUpload(file, targetLanguage, stylePreset, processMode);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
       handleFileSelect(file);
    } else {
        // Handle incorrect file type drop
        alert("Please drop a valid video or audio file.");
    }
  }, [onUpload, targetLanguage, stylePreset, processMode]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleUrlGenerate = () => {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (urlRegex.test(videoUrl)) {
      onUrlSubmit(videoUrl);
    } else {
      alert("Please enter a valid URL.");
    }
  };
  
  const [errorTitle, errorMessage] = error ? error.split('|') : [null, null];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 animate-fadeInUp">
        <div className="ui-panel p-6 sm:p-8">
            <div className="text-center mb-6">
                 <div className="flex justify-center mb-6">
                    <div className="tab-container w-full max-w-sm">
                        <div 
                          className="tab-slider"
                          style={{
                              width: 'calc(50% - 4px)',
                              transform: processMode === ProcessMode.HIGHLIGHTS ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                          }}
                        />
                        <button 
                          onClick={() => setProcessMode(ProcessMode.SUBTITLES)}
                          className={`tab-button ${processMode === ProcessMode.SUBTITLES ? 'active' : ''}`}
                          aria-pressed={processMode === ProcessMode.SUBTITLES}
                        >
                          <DocumentTextIcon className="w-5 h-5 mr-2"/>
                          Subtitles
                        </button>
                        <button 
                          onClick={() => setProcessMode(ProcessMode.HIGHLIGHTS)}
                          className={`tab-button ${processMode === ProcessMode.HIGHLIGHTS ? 'active' : ''}`}
                          aria-pressed={processMode === ProcessMode.HIGHLIGHTS}
                        >
                          <FilmIcon className="w-5 h-5 mr-2"/>
                          Highlights
                        </button>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white">
                    {processMode === ProcessMode.SUBTITLES ? 'Generate Subtitles for Your Media' : 'Find Highlight Reels Automatically'}
                </h2>
                <p className="text-gray-400 mt-2">
                    {processMode === ProcessMode.SUBTITLES ? 'Upload a video or audio file to get started.' : 'Upload a long-form video to find the best clips.'}
                </p>
            </div>
            
             <div className="flex justify-center items-center gap-2 my-6">
                <button onClick={() => setUploadMethod('file')} className={`control-button flex items-center gap-2 ${uploadMethod === 'file' ? 'active' : ''}`}>
                    <DocumentArrowUpIcon className="w-5 h-5" /> Upload File
                </button>
                <button onClick={() => setUploadMethod('link')} className={`control-button flex items-center gap-2 ${uploadMethod === 'link' ? 'active' : ''}`}>
                    <LinkIcon className="w-5 h-5" /> Paste Link
                </button>
            </div>

            {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                    <strong className="font-bold block">{errorTitle || 'Error'}</strong>
                    <span className="block sm:inline">{errorMessage || 'An unknown error occurred.'}</span>
                </div>
            )}
            
            {uploadMethod === 'file' && (
              <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className={`relative block w-full border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-300 ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                  <input type="file" id="file-upload" className="sr-only" onChange={handleFileChange} accept="video/*,audio/*" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <span className="mt-4 block font-semibold text-gray-200">
                          Drop a file here or <span className="text-indigo-400">click to upload</span>
                      </span>
                      <p className="mt-1 block text-sm text-gray-500">Supports video and audio files (up to 500MB)</p>
                  </label>
              </div>
            )}

            {uploadMethod === 'link' && (
              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-md py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <button onClick={handleUrlGenerate} className="action-button !w-auto btn-primary whitespace-nowrap px-6">
                      Generate
                    </button>
                  </div>
                  <p className="text-center text-sm text-gray-500">Supports YouTube, Google Drive, and direct video links.</p>
              </div>
            )}
            
            {processMode === ProcessMode.SUBTITLES && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Language</h3>
                      <p className="text-sm text-gray-400 mb-3">Translate subtitles to another language or keep the original.</p>
                      <select 
                          value={targetLanguage} 
                          onChange={e => setTargetLanguage(e.target.value)}
                          className="font-select"
                      >
                          {languageOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Style Preset</h3>
                       <p className="text-sm text-gray-400 mb-3">Choose how the AI should format the subtitles.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {presetOptions.map(preset => (
                            <button 
                                key={preset.id} 
                                onClick={() => setStylePreset(preset.id)}
                                className={`text-left p-3 rounded-md border-2 transition-all duration-200 ${stylePreset === preset.id ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                                title={preset.description}
                            >
                                <div className="flex items-center">
                                    <preset.icon className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span className="font-semibold text-sm">{preset.title}</span>
                                </div>
                            </button>
                        ))}
                      </div>
                  </div>
              </div>
            )}
        </div>
    </div>
  );
};

export default VideoUpload;
