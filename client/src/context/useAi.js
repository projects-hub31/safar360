import { useContext } from 'react';
import { AiContext } from './ai-context';

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within an AiProvider');
  return ctx;
}
