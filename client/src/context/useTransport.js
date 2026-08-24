import { useContext } from 'react';
import { TransportContext } from './transport-context';

export function useTransport() {
  const ctx = useContext(TransportContext);
  if (!ctx) throw new Error('useTransport must be used within a TransportProvider');
  return ctx;
}
