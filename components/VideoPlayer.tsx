import React, { useState, useEffect, useRef } from 'react';
import type { Subtitle, StyleOptions, Word, Position } from '../types';
import { Animation, EffectType } from '../types';

interface VideoPlayerProps {
  mediaFile: File;
  subtitles?: Subtitle[];
  styleOptions?: StyleOptions;
  playbackRange?: { start: number; end: number } | null;
  forceAspectRatio?: '9/16';
}

// Helper function to convert HEX to RGBA for opacity
const hexToRgba = (hex: string, opacity: number): string => {
    if (hex === 'transparent' || opacity === 0) {
        return 'rgba(0,0,0,0)';
    }
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
    }
    // Handle cases where the color might already be in rgb/rgba format from defaults
    if (hex.startsWith('rgb')) {
        const parts = hex.substring(hex.indexOf('(') + 1, hex.indexOf(')')).split(',');
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`;
    }
    return hex; // Fallback
};

// Helper function to generate the text effect style
const getEffectStyle = (styleOptions: StyleOptions): React.CSSProperties => {
    const { effect, strokeOptions, shadowOptions } = styleOptions;
    
    switch (effect) {
        case EffectType.SHADOW:
            return {
                textShadow: `${shadowOptions.offsetX}px ${shadowOptions.offsetY}px ${shadowOptions.blur}px ${shadowOptions.color}`,
            };
        case EffectType.OUTLINE:
            const { color, width } = strokeOptions;
            if (width <= 0) return { textShadow: 'none' };
            // Create a "stroke" effect using multiple text shadows
            const shadows = [
                `-${width}px -${width}px 0 ${color}`, `${width}px -${width}px 0 ${color}`,
                `-${width}px  ${width}px 0 ${color}`, `${width}px  ${width}px 0 ${color}`,
                `-${width}px 0 0 ${color}`, `${width}px 0 0 ${color}`,
                `0 -${width}px 0 ${color}`, `0 ${width}px 0 ${color}`
            ].join(', ');

            return { textShadow: shadows };
        case EffectType.NONE:
        default:
            return { textShadow: 'none' };
    }
};

const renderTextWithHighlights = (text: string, highlightColor: string): React.ReactNode => {
    if (!text.includes('**')) {
        return text;
    }
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={index} style={{ color: highlightColor, fontWeight: 900 }}>
                            {part.substring(2, part.length - 2)}
                        </strong>
                    );
                }
                return part;
            })}
        </>
    );
};

// Determines text alignment based on the broader position setting
const getTextAlign = (position: Position): 'left' | 'center' | 'right' => {
  if (position.includes('LEFT')) return 'left';
  if (position.includes('RIGHT')) return 'right';
  return 'center';
};


// Define component outside to prevent re-creation on re-renders
const SubtitleDisplay: React.FC<{
    activeSubtitle: Subtitle | null;
    styleOptions: StyleOptions;
    currentTime: number;
}> = ({ activeSubtitle, styleOptions, currentTime }) => {
    if (!activeSubtitle) return null;

    const baseClasses = `px-4 py-2 rounded-md transition-all duration-200 ${styleOptions.isBold ? 'font-bold' : ''} ${styleOptions.isItalic ? 'italic' : ''}`;

    const dynamicStyles: React.CSSProperties = {
        backgroundColor: hexToRgba(styleOptions.backgroundColor, styleOptions.backgroundOpacity),
        fontSize: `${styleOptions.fontSize}rem`,
        fontFamily: styleOptions.font,
        textTransform: styleOptions.textCase,
        letterSpacing: `${styleOptions.letterSpacing}em`,
        lineHeight: styleOptions.lineHeight,
        textAlign: getTextAlign(styleOptions.position),
        ...getEffectStyle(styleOptions),
    };

    const renderContent = () => {
        if (styleOptions.animation === Animation.KARAOKE) {
            const duration = activeSubtitle.end - activeSubtitle.start;
            const progress = (currentTime - activeSubtitle.start) / duration;
            const gradientPercentage = Math.max(0, Math.min(100, progress * 100));

            return (
                <span
                    style={{
                        background: `linear-gradient(to right, ${styleOptions.highlightColor} ${gradientPercentage}%, ${styleOptions.textColor} ${gradientPercentage}%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                    }}
                >
                    {renderTextWithHighlights(activeSubtitle.text, styleOptions.highlightColor)}
                </span>
            );
        }

        if (styleOptions.animation === Animation.WORD && activeSubtitle.words && activeSubtitle.words.length > 0) {
            return (
                <span>
                    {activeSubtitle.words.map((word: Word, index: number) => (
                        <span
                            key={index}
                            style={{
                                color: currentTime >= word.start ? styleOptions.highlightColor : styleOptions.textColor,
                                transition: 'color 0.1s ease-in-out',
                            }}
                        >
                            {word.word}{' '}
                        </span>
                    ))}
                </span>
            );
        }
        
        // Fallback for NONE animation or if word data is missing
        return <span style={{ color: styleOptions.textColor }}>{renderTextWithHighlights(activeSubtitle.text, styleOptions.highlightColor)}</span>;
    };

    return (
        <div className={`absolute inset-0 p-4 sm:p-6 md:p-8 lg:p-12 flex ${styleOptions.position} pointer-events-none`}>
            <div className={`max-w-4xl ${baseClasses}`} style={dynamicStyles}>
                {renderContent()}
            </div>
        </div>
    );
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ mediaFile, subtitles, styleOptions, playbackRange, forceAspectRatio }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaUrl = useRef(URL.createObjectURL(mediaFile));

    const [currentTime, setCurrentTime] = useState(0);
    const [activeSubtitle, setActiveSubtitle] = useState<Subtitle | null>(null);

    const videoObjectFitClass = forceAspectRatio === '9/16' ? 'object-cover' : 'object-contain';

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const now = video.currentTime;
            setCurrentTime(now);

            if (subtitles && styleOptions) {
                const currentSubtitle = subtitles.find(sub => now >= sub.start && now <= sub.end) || null;
                if (currentSubtitle !== activeSubtitle) {
                    setActiveSubtitle(currentSubtitle);
                }
            }

            if (playbackRange && now >= playbackRange.end) {
                video.pause();
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [subtitles, styleOptions, activeSubtitle, playbackRange]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (video && playbackRange) {
            video.currentTime = playbackRange.start;
            video.play();
        }
    }, [playbackRange]);

    useEffect(() => {
        // Cleanup the object URL when the component unmounts
        const url = mediaUrl.current;
        return () => {
            URL.revokeObjectURL(url);
        };
    }, []);

    return (
        <div className="w-full h-full relative">
            <video
                ref={videoRef}
                src={mediaUrl.current}
                controls
                className={`w-full h-full ${videoObjectFitClass}`}
            />
            {activeSubtitle && styleOptions && (
                <SubtitleDisplay 
                    activeSubtitle={activeSubtitle} 
                    styleOptions={styleOptions} 
                    currentTime={currentTime}
                />
            )}
        </div>
    );
};

export default VideoPlayer;