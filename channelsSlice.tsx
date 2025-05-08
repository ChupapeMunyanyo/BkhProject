import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Channel, ChannelStatus, ChannelsState, HealthCheckResult } from './types';

const initialState: ChannelsState = {
  channels: [],
  currentChannelId: null,
  error: null,
  isLoading: false,
};

export const checkChannelHealth = createAsyncThunk<HealthCheckResult, string>(
    'channels/checkHealth',
    async (channelId, { getState }) => {
      const state = getState() as { channels: ChannelsState };
      const channel = state.channels.channels.find(c => c.id === channelId);
      
      if (!channel) throw new Error('Channel not found');
  
      try {
        const response = await fetch(`${channel.url}`, {
          signal: AbortSignal.timeout(3000),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { 
          id: channelId, 
          isHealthy: data.status === 'healthy', // Адаптируйте под структуру ответа
          error: data.error || undefined
        };
      } catch (error) {
        return { 
          id: channelId, 
          isHealthy: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
  );

export const autoSwitchChannel = createAsyncThunk<string | null, void>(
  'channels/autoSwitch',
  async (_, { getState, dispatch }) => {
    const state = getState() as { channels: ChannelsState };
    
    const availableChannels = state.channels.channels
      .filter(c => c.status === 'idle')
      .sort((a, b) => b.priority - a.priority);
    
    if (availableChannels.length === 0) {
      return null;
    }
    
    const newChannel = availableChannels[0];
    dispatch(setCurrentChannel(newChannel.id));
    
    return newChannel.id;
  }
);

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels: (state, action: PayloadAction<Channel[]>) => {
      // Создаем новый массив каналов
      state.channels = action.payload.map(channel => ({ ...channel }));
      
      // Находим канал по умолчанию
      const defaultChannel = state.channels.find(c => c.status === 'idle');
      if (defaultChannel) {
        state.currentChannelId = defaultChannel.id;
        // Создаем новый объект для изменения статуса
        state.channels = state.channels.map(c => 
          c.id === defaultChannel.id 
            ? { ...c, status: 'connected' } 
            : c
        );
      }
    },
    setCurrentChannel: (state, action: PayloadAction<string>) => {
      // Сбрасываем статус предыдущего текущего канала
      if (state.currentChannelId) {
        state.channels = state.channels.map(c => 
          c.id === state.currentChannelId 
            ? { ...c, status: 'idle' } 
            : c
        );
      }
      
      // Устанавливаем новый текущий канал
      state.currentChannelId = action.payload;
      state.channels = state.channels.map(c => 
        c.id === action.payload 
          ? { ...c, status: 'connected', lastChecked: Date.now() } 
          : c
      );
    },
    setChannelStatus: (
      state,
      action: PayloadAction<{ id: string; status: ChannelStatus }>
    ) => {
      state.channels = state.channels.map(c => 
        c.id === action.payload.id 
          ? { ...c, status: action.payload.status, lastChecked: Date.now() } 
          : c
      );
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkChannelHealth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkChannelHealth.fulfilled, (state, action) => {
        const { id, isHealthy, error } = action.payload;
        
        state.channels = state.channels.map(channel => {
          if (channel.id !== id) return channel;
          
          const updates = {
            lastChecked: Date.now(),
            ...(!isHealthy ? {
              status: 'unavailable' as ChannelStatus,
              error,
              retryCount: channel.retryCount + 1
            } : {})
          };
          
          return { ...channel, ...updates };
        });
        
        if (!isHealthy && id === state.currentChannelId) {
          state.error = `Канал ${id} недоступен. Пытаемся переключиться...`;
        }
        
        state.isLoading = false;
      })
      .addCase(checkChannelHealth.rejected, (state, action) => {
        state.error = action.error.message || 'Ошибка проверки канала';
        state.isLoading = false;
      })
      .addCase(autoSwitchChannel.fulfilled, (state, action) => {
        if (action.payload === null) {
          state.error = 'Нет доступных каналов связи';
        } else {
          state.error = null;
        }
      });
  },
});

export const { setChannels, setCurrentChannel, setChannelStatus, setError } = channelsSlice.actions;
export default channelsSlice.reducer;