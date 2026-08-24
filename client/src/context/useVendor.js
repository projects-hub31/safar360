import { useContext } from 'react';
import { VendorContext } from './vendor-context';

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used within a VendorProvider');
  return ctx;
}
