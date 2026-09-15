'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { rehydrateAuth } from '@/features/auth/slices/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(rehydrateAuth());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
