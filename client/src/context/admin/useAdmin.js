import { useContext } from 'react';
import { AdminContext } from './admin-context';

export function useAdmin() {
  return useContext(AdminContext);
}
