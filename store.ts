import { configureStore } from '@reduxjs/toolkit';
import channelsReducer from './channelsSlice';

export const store = configureStore({
  reducer: {
    channels: channelsReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;