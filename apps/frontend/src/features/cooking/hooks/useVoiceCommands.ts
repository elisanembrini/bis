import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { speak } from "../audio";
import {
  DENIED_ERRORS,
  HARMLESS_ERRORS,
  type Recognition,
  getRecognitionConstructor,
  isErrorEvent,
  isResultEvent,
} from "../speechRecognition";
import { type VoiceCommand, parseCommand } from "../voiceCommands";
import { useVoicePhrases } from "./useVoicePhrases";

export type VoiceStatus = "unsupported" | "off" | "listening" | "paused" | "denied" | "error";

const RESTART_BASE_MS = 250;
const RESTART_MAX_MS = 5000;

type VoiceHandlers = {
  onCommand: (command: Exclude<VoiceCommand, "repeat">) => void;
  textToRepeat: () => string | undefined;
};

export const useVoiceCommands = ({ onCommand, textToRepeat }: VoiceHandlers) => {
  const { t } = useTranslation("cooking");
  const phrases = useVoicePhrases();
  const language = t("voice.recognitionLang");
  const [status, setStatus] = useState<VoiceStatus>(() =>
    getRecognitionConstructor() === undefined ? "unsupported" : "off",
  );
  const recognitionRef = useRef<Recognition | null>(null);
  const wantedRef = useRef(false);
  const pausedRef = useRef(false);
  const retriesRef = useRef(0);
  const restartRef = useRef<number | undefined>(undefined);
  const handlersRef = useRef({ onCommand, textToRepeat, phrases, language });
  const controlsRef = useRef<{ pause: () => void; resume: () => void }>({
    pause: () => undefined,
    resume: () => undefined,
  });

  useEffect(() => {
    handlersRef.current = { onCommand, textToRepeat, phrases, language };
  });

  useEffect(
    () => () => {
      wantedRef.current = false;
      window.clearTimeout(restartRef.current);
      recognitionRef.current?.abort();
    },
    [],
  );

  const listen = () => {
    const Constructor = getRecognitionConstructor();
    if (Constructor === undefined) {
      setStatus("unsupported");
      return;
    }
    if (recognitionRef.current === null) {
      const recognition = new Constructor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.addEventListener("result", (event) => {
        if (!isResultEvent(event)) {
          return;
        }
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript;
          if (result?.isFinal === true && transcript !== undefined) {
            retriesRef.current = 0;
            const command = parseCommand(transcript, handlersRef.current.phrases);
            if (command === "repeat") {
              const text = handlersRef.current.textToRepeat();
              if (text !== undefined) {
                controlsRef.current.pause();
                speak(text, handlersRef.current.language, controlsRef.current.resume);
              }
            } else if (command !== null) {
              handlersRef.current.onCommand(command);
            }
          }
        }
      });
      recognition.addEventListener("error", (event) => {
        if (!isErrorEvent(event)) {
          return;
        }
        if (DENIED_ERRORS.has(event.error)) {
          wantedRef.current = false;
          setStatus("denied");
        } else if (!HARMLESS_ERRORS.has(event.error)) {
          setStatus("error");
        }
      });
      recognition.addEventListener("end", () => {
        if (!wantedRef.current || pausedRef.current) {
          return;
        }
        const delay = Math.min(RESTART_MAX_MS, RESTART_BASE_MS * 2 ** retriesRef.current);
        retriesRef.current += 1;
        restartRef.current = window.setTimeout(listen, delay);
      });
      recognitionRef.current = recognition;
    }
    try {
      recognitionRef.current.lang = handlersRef.current.language;
      recognitionRef.current.start();
      setStatus("listening");
    } catch {
      setStatus("listening");
    }
  };

  const pause = () => {
    if (!wantedRef.current) {
      return;
    }
    pausedRef.current = true;
    window.clearTimeout(restartRef.current);
    recognitionRef.current?.abort();
    setStatus("paused");
  };

  const resume = () => {
    if (!wantedRef.current) {
      return;
    }
    pausedRef.current = false;
    listen();
  };

  useEffect(() => {
    controlsRef.current = { pause, resume };
  });

  return {
    status,
    enable: () => {
      wantedRef.current = true;
      pausedRef.current = false;
      retriesRef.current = 0;
      listen();
    },
    disable: () => {
      wantedRef.current = false;
      window.clearTimeout(restartRef.current);
      recognitionRef.current?.abort();
      setStatus("off");
    },
  };
};
