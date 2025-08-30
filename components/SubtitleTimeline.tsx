import React, { useState, useRef, useEffect } from 'react';
import type { Subtitle } from '../types';

interface SubtitleTimelineProps {
  subtitles: Subtitle[];
  onUpdateSubtitle: (index: number, newText: string) => void;
}

const formatTime = (seconds: number): string => {
    const date = new Date(0);
    date.setSeconds(seconds);
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${minutes}:${secs}.${ms}`;
};

const SubtitleTimeline: React.FC<SubtitleTimelineProps> = ({ subtitles, onUpdateSubtitle }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (editingIndex !== null) {
            const currentItemRef = itemRefs.current[editingIndex];
            if (currentItemRef) {
                currentItemRef.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            }
        }
    }, [editingIndex]);

    const handleEditStart = (index: number, text: string) => {
        setEditingIndex(index);
        setEditText(text);
    };

    const handleSave = (index: number) => {
        if (editText.trim() && editText.trim() !== subtitles[index].text) {
            onUpdateSubtitle(index, editText.trim());
        }
        setEditingIndex(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSave(index);
        }
        if (event.key === 'Escape') {
            setEditingIndex(null);
        }
    };
    
    return (
        <div className="flex flex-col gap-3 -mr-4 pr-4">
            {subtitles.map((sub, index) => (
                <div 
                    key={`${index}-${sub.start}`} 
                    ref={el => { itemRefs.current[index] = el; }}
                    className="group bg-gray-800/50 p-3 rounded-lg flex gap-4 text-sm transition-all duration-200 hover:bg-gray-700/80 border border-gray-700 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] hover:-translate-y-1"
                >
                    <div className="font-mono text-xs text-indigo-300/70 flex flex-col justify-center items-center flex-shrink-0 w-20 bg-black/20 rounded-md py-2 transition-colors group-hover:text-indigo-300">
                        <span>{formatTime(sub.start)}</span>
                        <span className='text-gray-500 text-lg leading-none'>↓</span>
                        <span>{formatTime(sub.end)}</span>
                    </div>
                    <div className="flex-grow min-w-0 py-1">
                        {editingIndex === index ? (
                            <div>
                                <textarea
                                    ref={textareaRef}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onBlur={() => handleSave(index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-full bg-gray-900 text-white p-2 rounded-md resize-none border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1 px-1">
                                    Editing will disable word-level animations for this line.
                                </p>
                            </div>
                        ) : (
                            <p 
                                onClick={() => handleEditStart(index, sub.text)}
                                className="cursor-pointer text-gray-200 p-2 rounded-md h-full flex items-center group-hover:text-white transition-colors"
                                title="Click to edit"
                            >
                                {sub.text}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SubtitleTimeline;