import { GoogleGenAI, Type } from "@google/genai";
import type { Subtitle, HighlightClip } from '../types';
import { StylePreset } from '../types';

/**
 * NOTE: This file represents a server-side process.
 * In a real application, this code would run on a backend server (e.g., Node.js).
 * It would receive the uploaded file, process it (e.g., extract audio with FFmpeg),
 * and then make the call to the Gemini API.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a GoogleGenAI.Part object with base64-encoded data.
 * On a server, this might not be necessary if the file is streamed or accessed from disk.
 */
const fileToGenerativePart = (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            if (!data) {
                reject(new Error("Failed to read file data."));
                return;
            }
            resolve({
                inlineData: {
                    mimeType: file.type,
                    data: data,
                },
            });
        };
        reader.onerror = (error) => reject(error);
    });
};

const subtitleSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING, description: 'The full text of the subtitle line.' },
            start: { type: Type.NUMBER, description: 'The start time of the subtitle in seconds.' },
            end: { type: Type.NUMBER, description: 'The end time of the subtitle in seconds.' },
            words: {
                type: Type.ARRAY,
                description: 'Optional word-level timestamps for the subtitle line. Omit if not applicable for the style.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                    },
                    required: ['word', 'start', 'end']
                }
            }
        },
        required: ['text', 'start', 'end']
    }
};

const highlightSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'A short, catchy, YouTube-style title for the highlight clip.' },
            description: { type: Type.STRING, description: 'A brief, one-sentence summary of what happens in the clip.' },
            start: { type: Type.NUMBER, description: 'The start time of the highlight in seconds.' },
            end: { type: Type.NUMBER, description: 'The end time of the highlight in seconds.' },
        },
        required: ['title', 'description', 'start', 'end']
    }
};

const handleApiError = (error: unknown): Error => {
    console.error('[Server] Gemini API call failed:', error);
    let userFriendlyMessage = "The AI service failed to process the video. Please try again later.";
    if (error instanceof Error && error.message) {
        if (error.message.includes('xhr error') || error.message.includes('500') || error.message.includes('FETCH_ERROR')) {
             userFriendlyMessage = 'A network error occurred, which can happen with large files or an unstable connection. Please try a smaller file or check your connection.';
        } else if (error.message.includes('API_KEY_INVALID')) {
            userFriendlyMessage = 'Your API key appears to be invalid. Please check your environment configuration and ensure it is set correctly.';
        } else if (error.message.toLowerCase().includes('quota')) {
            userFriendlyMessage = 'The API quota has been exceeded. Please check your Google AI account for usage limits.';
        }
    }
    return new Error(userFriendlyMessage);
};

/**
 * Simulates the server-side process of generating subtitles.
 * @param mediaFile The video or audio file uploaded by the client.
 * @param targetLanguage The target language for translation, or 'original' for none.
 * @param stylePreset The desired style for the generated subtitles.
 */
export const processVideoForSubtitles = async (mediaFile: File, targetLanguage: string, stylePreset: StylePreset): Promise<Subtitle[]> => {
  console.log(`[Server] Processing file for subtitles: ${mediaFile.name} with preset: ${stylePreset}`);

  try {
      const mediaPart = await fileToGenerativePart(mediaFile);

      let prompt: string;
      const languageInstruction = (targetLanguage && targetLanguage !== 'original')
          ? `Transcribe the spoken words in the provided file, and then translate the transcription into fluent ${targetLanguage}. The final subtitles must be in ${targetLanguage}.`
          : `Transcribe the spoken words in the provided file (which could be video or audio).`;

      const baseInstruction = `${languageInstruction} The subtitles should be concise and broken into logical lines. Ensure the timestamps (start and end) are sequential and do not overlap incorrectly. Provide the output as a JSON array that matches the specified schema.`;
      
      switch (stylePreset) {
        case StylePreset.TIKTOK:
            prompt = `${baseInstruction}
            STYLE INSTRUCTIONS:
            - Generate short, punchy, and engaging subtitle lines suitable for social media like TikTok.
            - Each subtitle object should represent a very short phrase or sentence.
            - CRITICALLY IMPORTANT: You MUST include accurate word-level timestamps.`;
            break;
        case StylePreset.KEYWORDS:
            prompt = `${baseInstruction}
            STYLE INSTRUCTIONS:
            - Identify the most important keywords or phrases in each subtitle line.
            - In the 'text' field, wrap these keywords with double asterisks. For example: "This is a **very important** message."
            - Do NOT include word-level timestamps; the 'words' array should be omitted for this style.`;
            break;
        case StylePreset.EMOJIS:
            prompt = `${baseInstruction}
            STYLE INSTRUCTIONS:
            - Analyze the sentiment and context of each subtitle line.
            - Append one or two relevant emojis to the end of the 'text' field for each line to add expressiveness.
            - Do NOT include word-level timestamps; the 'words' array should be omitted for this style.`;
            break;
        case StylePreset.STANDARD:
        default:
            prompt = `${baseInstruction}
            STYLE INSTRUCTIONS:
            - Generate standard, high-quality subtitles.
            - CRITICALLY IMPORTANT: You MUST include accurate word-level timestamps for every line.`;
            break;
      }

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }, mediaPart] },
          config: {
              responseMimeType: 'application/json',
              responseSchema: subtitleSchema,
          }
      });

      const jsonText = response.text.trim();
      
      if (!jsonText.startsWith('[') || !jsonText.endsWith(']')) {
          console.error("[Server] Invalid JSON response from API:", jsonText);
          throw new Error("Failed to parse subtitles from the AI. The response was not a valid JSON array.");
      }

      const generatedSubtitles = JSON.parse(jsonText) as Subtitle[];
      console.log(`[Server] Successfully generated ${generatedSubtitles.length} subtitle lines.`);
      return generatedSubtitles;

  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Simulates the server-side process of finding highlight clips in a video.
 * @param mediaFile The video or audio file.
 */
export const processVideoForHighlights = async (mediaFile: File): Promise<HighlightClip[]> => {
    console.log(`[Server] Processing file for highlights: ${mediaFile.name}`);

    try {
        const mediaPart = await fileToGenerativePart(mediaFile);
        const prompt = `You are an expert video editor. Analyze the provided video and identify the most engaging, viral-worthy, or important moments that would make good short clips. For each moment you identify, create a highlight clip.

        For each clip, provide:
        1.  A short, catchy, YouTube-style title.
        2.  A brief, one-sentence summary of what happens in the clip.
        3.  The precise start and end timestamps in seconds.

        Return the result as a JSON array that strictly follows the specified schema. Ensure the timestamps are accurate and sequential.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, mediaPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: highlightSchema,
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText.startsWith('[') || !jsonText.endsWith(']')) {
            console.error("[Server] Invalid JSON response from API for highlights:", jsonText);
            throw new Error("Failed to parse highlights from the AI. The response was not a valid JSON array.");
        }

        const generatedClips = JSON.parse(jsonText) as HighlightClip[];
        console.log(`[Server] Successfully generated ${generatedClips.length} highlight clips.`);
        return generatedClips;

    } catch (error) {
        throw handleApiError(error);
    }
};
