import React, { useState, useCallback, useEffect } from 'react';
import { AppState, StyleOptions, Subtitle, Font, Position, Animation, EffectType, TextCase, StylePreset, ProcessMode, HighlightClip } from './types';
import VideoUpload from './components/VideoUpload';
import SubtitleEditor from './components/SubtitleEditor';
import HighlightViewer from './components/HighlightViewer';
import Loader from './components/Loader';
import { generateSubtitles, generateHighlights } from './services/subtitleService';
import { GithubIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[] | null>(null);
  const [highlightClips, setHighlightClips] = useState<HighlightClip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [styleOptions, setStyleOptions] = useState<StyleOptions>({
    font: Font.MODERN,
    fontSize: 2.5,
    isBold: true,
    isItalic: false,
    textCase: TextCase.NORMAL,
    
    // Spacing
    letterSpacing: 0.05,
    lineHeight: 1.2,

    // Colors
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5,
    highlightColor: '#FFFF00',

    // Effects
    effect: EffectType.SHADOW,
    strokeOptions: {
      color: '#000000',
      width: 2,
    },
    shadowOptions: {
      color: 'rgba(0, 0, 0, 0.75)',
      blur: 5,
      offsetX: 2,
      offsetY: 2,
    },
    
    // Position & Animation
    position: Position.BOTTOM_CENTER,
    animation: Animation.WORD,
  });

  // Effect to simulate progress when in the PROCESSING state
  useEffect(() => {
    if (appState !== AppState.PROCESSING) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        // Simulate a non-linear, more "realistic" progress update
        const increment = Math.random() * 5 + 1; // Increment by 1-6%
        return Math.min(prev + increment, 95);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [appState]);


  const handleFileUpload = useCallback(async (file: File, targetLanguage: string, stylePreset: StylePreset, processMode: ProcessMode) => {
    setMediaFile(file);
    setAppState(AppState.PROCESSING);
    setProgress(0);
    setError(null);
    setSubtitles(null);
    setHighlightClips(null);

    try {
      if (processMode === ProcessMode.SUBTITLES) {
        const generatedSubtitles = await generateSubtitles(file, targetLanguage, stylePreset);
        setProgress(100);
        setSubtitles(generatedSubtitles);
        setAppState(AppState.EDITING);
        
        // Apply specific style configurations for presets
        switch (stylePreset) {
          case StylePreset.TIKTOK:
            setStyleOptions(prev => ({
                ...prev,
                font: Font.GEOMETRIC,
                fontSize: 4.0,
                isBold: true,
                textCase: TextCase.UPPERCASE,
                textColor: '#FFFFFF',
                highlightColor: '#FFFF00',
                effect: EffectType.SHADOW,
                shadowOptions: {
                    color: 'rgba(0,0,0,0.8)',
                    blur: 8,
                    offsetX: 0,
                    offsetY: 4
                },
                position: Position.MIDDLE_CENTER,
                animation: Animation.WORD,
                lineHeight: 1.1,
                backgroundOpacity: 0,
            }));
            break;
          case StylePreset.MINIMALIST:
            setStyleOptions(prev => ({
              ...prev,
              font: Font.SANS,
              fontSize: 2.2,
              isBold: false,
              isItalic: false,
              textCase: TextCase.NORMAL,
              textColor: '#FFFFFF',
              backgroundOpacity: 0,
              effect: EffectType.NONE,
              position: Position.BOTTOM_CENTER,
              animation: Animation.NONE,
              lineHeight: 1.3,
              letterSpacing: 0,
            }));
            break;
          case StylePreset.BOLD_OUTLINE:
            setStyleOptions(prev => ({
              ...prev,
              font: Font.CONDENSED,
              fontSize: 4.5,
              isBold: true,
              textCase: TextCase.UPPERCASE,
              textColor: '#FFFF00',
              highlightColor: '#FFFFFF',
              backgroundOpacity: 0,
              effect: EffectType.OUTLINE,
              strokeOptions: {
                color: '#000000',
                width: 3,
              },
              position: Position.BOTTOM_CENTER,
              animation: Animation.KARAOKE,
              lineHeight: 1.1,
              letterSpacing: 0.05,
            }));
            break;
          case StylePreset.POP_3D:
            setStyleOptions(prev => ({
              ...prev,
              font: Font.ROUNDED,
              fontSize: 3.5,
              isBold: true,
              textCase: TextCase.NORMAL,
              textColor: '#FFFFFF',
              highlightColor: '#818cf8', // indigo-400
              backgroundOpacity: 0,
              effect: EffectType.SHADOW,
              shadowOptions: {
                color: 'rgba(0, 0, 0, 1)',
                blur: 0,
                offsetX: 4,
                offsetY: 4,
              },
              position: Position.MIDDLE_CENTER,
              animation: Animation.WORD,
              lineHeight: 1.2,
            }));
            break;
        }
      } else { // ProcessMode.HIGHLIGHTS
        const generatedClips = await generateHighlights(file);
        setProgress(100);
        setHighlightClips(generatedClips);
        setAppState(AppState.VIEWING_HIGHLIGHTS);
      }
    } catch (err) {
      console.error(err);
      const rawMessage = err instanceof Error ? err.message : 'Failed to process your request. Please try again.';
      
      // Create a structured error string for better display: "Title|Message"
      let structuredError = 'Request Failed|' + rawMessage;

      if (rawMessage.toLowerCase().includes('api key')) {
        structuredError = 'API Key Error|' + rawMessage;
      } else if (rawMessage.toLowerCase().includes('quota')) {
        structuredError = 'Quota Exceeded|' + rawMessage;
      } else if (rawMessage.toLowerCase().includes('file is too large')) {
        const sizeMessage = rawMessage.replace('File is too large', 'Your file');
        structuredError = 'File Too Large|' + sizeMessage;
      } else if (rawMessage.toLowerCase().includes('network')) {
        structuredError = 'Network Error|' + rawMessage;
      } else if (rawMessage.toLowerCase().includes('parse')) {
        structuredError = 'AI Response Error|' + rawMessage;
      }
      
      setError(structuredError);
      setAppState(AppState.UPLOAD);
    }
  }, []);
  
  const handleUrlSubmit = useCallback((url: string) => {
    console.log(`URL submitted for processing: ${url}`);
    setError('URL Processing Not Supported|This demo processes files directly. In a production app, a server would fetch the video from your link to begin analysis. This UI is for demonstration purposes.');
    setAppState(AppState.UPLOAD);
  }, []);
  
  const handleBack = () => {
    setMediaFile(null);
    setSubtitles(null);
    setHighlightClips(null);
    setError(null);
    setProgress(0);
    setAppState(AppState.UPLOAD);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.UPLOAD:
        return <VideoUpload onUpload={handleFileUpload} onUrlSubmit={handleUrlSubmit} error={error} />;
      case AppState.PROCESSING:
        return <Loader message="Analyzing your media file... This may take a few minutes." progress={progress} />;
      case AppState.EDITING:
        if (mediaFile && subtitles) {
          return (
            <SubtitleEditor
              mediaFile={mediaFile}
              subtitles={subtitles}
              setSubtitles={setSubtitles}
              styleOptions={styleOptions}
              setStyleOptions={setStyleOptions}
              onBack={handleBack}
            />
          );
        }
        return <VideoUpload onUpload={handleFileUpload} onUrlSubmit={handleUrlSubmit} error="Something went wrong. Please upload again." />;
      case AppState.VIEWING_HIGHLIGHTS:
        if (mediaFile && highlightClips) {
          return (
            <HighlightViewer
              mediaFile={mediaFile}
              clips={highlightClips}
              onBack={handleBack}
            />
          );
        }
        return <VideoUpload onUpload={handleFileUpload} onUrlSubmit={handleUrlSubmit} error="Something went wrong. Please upload again." />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col">
      <header className="w-full p-4 bg-transparent backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tighter gradient-text">
            AI Subtitle Generator
          </h1>
          <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <GithubIcon className="w-6 h-6" />
          </a>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div key={appState} className="w-full h-full flex items-center justify-center">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
