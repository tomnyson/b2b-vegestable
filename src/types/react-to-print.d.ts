import { ReactElement } from 'react';

declare module 'react-to-print' {
  interface UseReactToPrintOptions {
    documentTitle?: string;
    onBeforeGetContent?: () => Promise<void> | void;
    onBeforePrint?: () => Promise<void> | void;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    content: () => HTMLElement | null;
  }

  export function useReactToPrint(options: UseReactToPrintOptions): () => void;

  interface ReactToPrintProps {
    trigger?: () => ReactElement;
    content: () => HTMLElement | null;
    documentTitle?: string;
    onBeforeGetContent?: () => Promise<void> | void;
    onBeforePrint?: () => Promise<void> | void;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
  }

  export default function ReactToPrint(props: ReactToPrintProps): ReactElement;
} 