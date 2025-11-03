import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, Blob, LiveServerMessage, Modality } from '@google/genai';
import { correctText } from '../services/geminiService';

// Audio encoding function
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const getApiKey = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return apiKey;
};

interface UseVoiceToTextOptions {
  onCorrectedTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceToText = ({ onCorrectedTranscript, onError }: UseVoiceToTextOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Use a ref for the recording status to avoid stale closures in callbacks
  const isRecordingRef = useRef(false);

  // Update both state and ref for consistency
  const setRecordingStatus = useCallback((status: boolean) => {
    isRecordingRef.current = status;
    setIsRecording(status);
  }, []);

  // Refs for callbacks to avoid stale closures
  const onCorrectedTranscriptRef = useRef(onCorrectedTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCorrectedTranscriptRef.current = onCorrectedTranscript;
  }, [onCorrectedTranscript]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  const cleanupAudioResources = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    setSoundLevel(0);

    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
    }
    if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
        audioContextRef.current = null;
    }
  }, []);

  const processFinalTranscript = useCallback(async () => {
    // Only process if there's something to process, to avoid empty calls
    if (accumulatedTranscriptRef.current.trim()) {
        const finalTranscript = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = ''; 

        setIsCorrecting(true);
        try {
            const corrected = await correctText(finalTranscript);
            onCorrectedTranscriptRef.current(corrected);
        } catch (e) {
            console.error("Correction failed, using original transcript.", e);
            onCorrectedTranscriptRef.current(finalTranscript);
            onErrorRef.current?.("La correction du texte a échoué.");
        } finally {
            setIsCorrecting(false);
        }
    } else {
       accumulatedTranscriptRef.current = ''; 
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    
    // This function's only job is to stop the audio flow to the server.
    // The server will detect the stream has ended and will then send the final transcript
    // before triggering the `onclose` event.
    cleanupAudioResources();
    
    // Add a safeguard timeout in case the onclose event never fires from the server.
    setTimeout(() => {
        if(isRecordingRef.current) {
            console.warn("Server onclose event did not fire within 1.5s. Forcing shutdown.");
            const sessionPromise = sessionPromiseRef.current;
            sessionPromiseRef.current = null;
            sessionPromise?.then(session => session.close()).catch(() => {}); // Manually close
            processFinalTranscript(); // Process whatever we have
            setRecordingStatus(false); // Force state update
        }
    }, 1500);

  }, [cleanupAudioResources, processFinalTranscript, setRecordingStatus]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    setRecordingStatus(true);
    accumulatedTranscriptRef.current = '';

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = context;
        
        if (context.state === 'suspended') await context.resume();
        
        const source = context.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        analyserRef.current = analyser;

        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
            if (!analyserRef.current || !isRecordingRef.current) return;
            
            analyserRef.current.getByteTimeDomainData(dataArray);
            let sumSquares = 0.0;
            for (const amplitude of dataArray) {
                const val = (amplitude / 128.0) - 1.0;
                sumSquares += val * val;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            setSoundLevel(Math.min(1, rms * 2.5));
            
            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        animationFrameRef.current = requestAnimationFrame(updateLevel);

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    if (!audioContextRef.current || !sourceRef.current || !isRecordingRef.current) return;
                    
                    const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        if (!isRecordingRef.current) return;
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        sessionPromiseRef.current?.then((session) => {
                           if (isRecordingRef.current) {
                             session.sendRealtimeInput({ media: pcmBlob });
                           }
                        }).catch(e => {
                            console.error("Failed to send audio data.", e);
                            onErrorRef.current?.("Erreur de connexion, l'enregistrement est arrêté.");
                            stopRecording();
                        });
                    };
                    sourceRef.current.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current.destination);
                },
                onmessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const { text } = message.serverContent.inputTranscription;
                        if (text) {
                            accumulatedTranscriptRef.current += text;
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Gemini Live API Error:', e);
                    onErrorRef.current?.(e.message || 'Une erreur inconnue est survenue.');
                    if (isRecordingRef.current) {
                        stopRecording();
                    }
                },
                onclose: () => {
                    if (!isRecordingRef.current) return; // Prevent multiple calls from safeguard timeout
                    
                    cleanupAudioResources();
                    processFinalTranscript();
                    setRecordingStatus(false);
                    sessionPromiseRef.current = null;
                },
            },
            config: {
                responseModalities: [Modality.AUDIO], 
                inputAudioTranscription: {},
            },
        });
        
        await sessionPromiseRef.current;

    } catch (err) {
        console.error('Failed to start recording:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to start recording.';
        onErrorRef.current?.(errorMessage.includes("Permission denied") ? "Permission au microphone refusée." : errorMessage);
        setRecordingStatus(false);
        cleanupAudioResources();
    }
  }, [stopRecording, cleanupAudioResources, processFinalTranscript, setRecordingStatus]);
  
  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  // Add cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
    };
  }, [stopRecording]);

  return { isRecording, isCorrecting, toggleRecording, soundLevel };
};