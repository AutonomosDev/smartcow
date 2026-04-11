/**
 * src/components/ui/ai-prompt-box.tsx
 * Versión Final — Estilo Open WebUI (Sin Model Pill).
 */

"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Globe, Paperclip, Square, X, Mic, Brain } from "lucide-react";
import { motion } from "framer-motion";

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
        "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none",
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
      "z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-md animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ─── Dialog ─────────────────────────────────────────────────────────────────

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-all">
        <X className="h-5 w-5 text-gray-500 hover:text-gray-900" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

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
        isRecording ? "opacity-100" : "opacity-0 h-0"
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
              height: [
                Math.max(2, Math.random() * 8),
                Math.max(4, Math.random() * 16),
                Math.max(2, Math.random() * 8)
              ],
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

// ─── ImageViewDialog ─────────────────────────────────────────────────────────

interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
        <DialogTitle className="sr-only">Vista previa de imagen</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Vista previa completa"
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
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

// ─── PromptInput Component ─────────────────────────────────────────────────────

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
              "rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 focus-within:shadow-md focus-within:border-gray-200 font-inherit",
              isLoading && "border-gray-500/30",
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

// ─── PromptInputTextarea ──────────────────────────────────────────────────────

interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
}

const PromptInputTextarea: React.FC<
  PromptInputTextareaProps & React.ComponentProps<typeof Textarea>
> = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-[15px] font-inherit placeholder:text-gray-400 px-2", className)}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
};

// ─── PromptInputBox (componente principal) ────────────────────────────────────

export interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[], webSearch?: boolean, reasoningMode?: boolean) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBox = React.forwardRef(
  (props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
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
    const promptBoxRef = React.useRef<HTMLDivElement>(null);

    const isImageFile = (file: File) => file.type.startsWith("image/");

    const processFile = (file: File) => {
      if (file.size > 20 * 1024 * 1024) return;
      setFiles([file]);
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) =>
          setFilePreviews({ [file.name]: e.target?.result as string });
        reader.readAsDataURL(file);
      }
    };

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) processFile(droppedFiles[0]);
    }, []);

    const handleRemoveFile = (index: number) => {
      const fileToRemove = files[index];
      if (fileToRemove && filePreviews[fileToRemove.name]) setFilePreviews({});
      setFiles([]);
    };

    const handlePaste = React.useCallback((e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break;
          }
        }
      }
    }, []);

    React.useEffect(() => {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    const handleSubmit = () => {
      if (input.trim() || files.length > 0) {
        onSend(input, files, webSearchEnabled, reasoningMode);
        setInput("");
        setFiles([]);
        setFilePreviews({});
      }
    };

    const handleStartRecording = () => {};
    const handleStopRecording = (duration: number) => {
      setIsRecording(false);
      onSend(`[Mensaje de voz - ${duration} segundos]`, []);
    };

    const hasContent = input.trim() !== "" || files.length > 0;

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn(
            "w-full bg-white transition-all duration-300",
            isRecording && "border-red-400/50 shadow-red-50/20",
            className
          )}
          disabled={isLoading || isRecording}
          ref={ref || promptBoxRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Adjuntos */}
          {files.length > 0 && !isRecording && (
            <div className="flex flex-wrap gap-2 p-0 pb-2 transition-all duration-300">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.startsWith("image/") && filePreviews[file.name] ? (
                    <div
                      className="w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border border-gray-100 shadow-sm"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviews[file.name]}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 max-w-[200px]">
                      <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 ml-1"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-700" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div
            className={cn(
              "transition-all duration-300",
              isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"
            )}
          >
            <PromptInputTextarea
              placeholder={placeholder}
              className="text-base min-h-[44px]"
            />
          </div>

          {isRecording && (
            <VoiceRecorder
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          )}

          {/* Toolbar Estilo Open WebUI V2 - Sin Model Pill y sin Azules */}
          <div className="flex items-center justify-between mt-1 pt-1 bg-white">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {/* Botón Plus / Clip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <button 
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50/50 text-gray-400 transition-colors"
                        onClick={() => uploadInputRef.current?.click()}
                      >
                       <Paperclip className="h-4 w-4" />
                       <input
                           ref={uploadInputRef}
                           type="file"
                           className="hidden"
                           onChange={(e) => {
                             if (e.target.files && e.target.files.length > 0)
                               processFile(e.target.files[0]);
                             if (e.target) e.target.value = "";
                           }}
                           accept="image/*,.pdf,.xlsx,.xls,.csv"
                       />
                     </button>
                  </TooltipTrigger>
                  <TooltipContent>Adjuntar Imagen</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Web Search Icon */}
              <TooltipProvider>
                <Tooltip>
                   <TooltipTrigger asChild>
                     <button 
                       onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          webSearchEnabled ? "text-[#06200F] bg-gray-50" : "text-gray-400 hover:bg-gray-50/50"
                        )}
                     >
                       <Globe className="h-[17px] w-[17px]" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent>Búsqueda Web</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Reasoning Mode Icon */}
              <TooltipProvider>
                <Tooltip>
                   <TooltipTrigger asChild>
                     <button 
                       onClick={() => setReasoningMode(!reasoningMode)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          reasoningMode ? "text-emerald-700 bg-emerald-50/50" : "text-gray-400 hover:bg-gray-50/50"
                        )}
                     >
                       <Brain className="h-[17px] w-[17px]" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent>Razonamiento Profundo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice icon */}
              <button 
                onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                    isRecording ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-gray-50/50"
                  )}
              >
                <Mic className="h-[18px] w-[18px]" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSubmit}
                disabled={(!hasContent && !isLoading) || isRecording}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                  hasContent || isLoading 
                    ? "bg-[#06200F] text-white hover:bg-black" 
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Square className="h-3 w-3 fill-white" />
                ) : (
                  <ArrowUp className="h-[17px] w-[17px]" />
                )}
              </button>
            </div>
          </div>
        </PromptInput>

        <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </>
    );
  }
);
PromptInputBox.displayName = "PromptInputBox";
