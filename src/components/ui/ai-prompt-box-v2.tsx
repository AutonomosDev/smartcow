/**
 * src/components/ui/ai-prompt-box-v2.tsx
 * Versión Pristine White (V2) - Aislada para /chat-v2.
 */

"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ArrowUp, Globe, Paperclip, Square, X, Mic, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { DialogV2 } from "./dialog-v2";

// ─── Utility ────────────────────────────────────────────────────────────────

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

// ─── Textarea ───────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none font-inherit",
        className
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ─── Tooltip ────────────────────────────────────────────────────────────────

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ─── VoiceRecorder ──────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, time, onStartRecording, onStopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full transition-all duration-300 py-3",
        isRecording ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-sm text-gray-700">{formatTime(time)}</span>
      </div>
      <div className="w-full h-6 flex items-center justify-center gap-[2px] px-8">
        {[...Array(visualizerBars)].map((_, i) => (
          <motion.div
            key={i}
            className="w-[2px] rounded-full bg-red-400"
            animate={{
              height: [2, 12, 4, 16, 2],
              opacity: isRecording ? [0.4, 1, 0.4] : 0.2
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2 + Math.random() * 0.5,
              delay: i * 0.03,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── PromptInput Context ─────────────────────────────────────────────────────

interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}

const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput debe usarse dentro de PromptInput");
  return context;
}

// ─── Main Wrapper ─────────────────────────────────────────────────────────────

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-300 focus-within:shadow-md focus-within:border-gray-200 font-inherit",
              isLoading && "border-emerald-100 shadow-emerald-50/20",
              className
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = "PromptInput";

// ─── Textarea Component ──────────────────────────────────────────────────────

const PromptInputTextarea: React.FC<{ placeholder?: string; className?: string }> = ({ className, placeholder }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-[15px] font-inherit placeholder:text-gray-400 px-1", className)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

// ─── PromptInputBoxV2 ────────────────────────────────────────────────────────

export interface PromptInputBoxV2Props {
  onSend?: (message: string, files?: File[], webSearch?: boolean, reasoningMode?: boolean) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBoxV2 = React.forwardRef(
  (props: PromptInputBoxV2Props, ref: React.Ref<HTMLDivElement>) => {
    const {
      onSend = () => {},
      isLoading = false,
      placeholder = "Mensaje a SmartCow...",
      className,
    } = props;

    const [input, setInput] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<{ [key: string]: string }>({});
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
    const [reasoningMode, setReasoningMode] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
      if (file.size > 20 * 1024 * 1024) return;
      setFiles([file]);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result as string });
        reader.readAsDataURL(file);
      }
    };

    const handleRemoveFile = (index: number) => {
      setFiles([]);
      setFilePreviews({});
    };

    const handleSubmit = () => {
      if (input.trim() || files.length > 0) {
        onSend(input, files, webSearchEnabled, reasoningMode);
        setInput("");
        setFiles([]);
        setFilePreviews({});
      }
    };

    const hasContent = input.trim() !== "" || files.length > 0;

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn("w-full bg-white", className)}
          disabled={isLoading || isRecording}
          onDrop={(e) => {
             e.preventDefault();
             if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Archivos adjuntos */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative group">
                  {file.type.startsWith("image/") ? (
                    <div 
                      className="w-14 h-14 rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                    >
                      <img src={filePreviews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-gray-100 p-0.5 shadow-sm">
                        <X size={10} className="text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-[11px] font-medium text-gray-600">
                      <Paperclip size={12} className="text-gray-400" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => handleRemoveFile(idx)}><X size={12} className="text-gray-400 hover:text-gray-950" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <PromptInputTextarea placeholder={placeholder} className={isRecording ? "hidden" : ""} />
          
          <VoiceRecorder 
            isRecording={isRecording} 
            onStartRecording={() => {}} 
            onStopRecording={(d) => {
              setIsRecording(false);
              onSend(`[Voz: ${d}s]`, []);
            }} 
          />

          {/* Toolbar V2 */}
          <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => uploadInputRef.current?.click()} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                    <Paperclip size={18} />
                    <input ref={uploadInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Adjuntar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)} 
                    className={cn("p-1.5 rounded-lg transition-colors", webSearchEnabled ? "text-[#06200F] bg-gray-50 font-bold" : "text-gray-400 hover:bg-gray-50")}
                  >
                    <Globe size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Búsqueda Web</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setReasoningMode(!reasoningMode)} 
                    className={cn("p-1.5 rounded-lg transition-colors", reasoningMode ? "text-emerald-700 bg-emerald-50" : "text-gray-400 hover:bg-gray-50")}
                  >
                    <Brain size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Razonamiento</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsRecording(!isRecording)} 
                className={cn("p-1.5 rounded-lg transition-colors", isRecording ? "text-red-500 bg-red-50" : "text-gray-400 hover:bg-gray-50")}
              >
                <Mic size={18} />
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={(!hasContent && !isLoading) || isRecording}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                  hasContent || isLoading ? "bg-[#06200F] text-white" : "bg-gray-50 text-gray-200"
                )}
              >
                {isLoading ? <Square size={14} className="fill-white" /> : <ArrowUp size={18} />}
              </button>
            </div>
          </div>
        </PromptInput>

        <DialogV2.Root open={!!selectedImage} onOpenChange={(o) => !o && setSelectedImage(null)}>
          <DialogV2.Content>
            <DialogV2.Header>
              <DialogV2.Title>Previsualización</DialogV2.Title>
            </DialogV2.Header>
            {selectedImage && <img src={selectedImage} alt="Preview" className="w-full h-auto rounded-xl shadow-sm" />}
          </DialogV2.Content>
        </DialogV2.Root>
      </>
    );
  }
);
PromptInputBoxV2.displayName = "PromptInputBoxV2";
