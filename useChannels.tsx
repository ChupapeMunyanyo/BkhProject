import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { 
  checkChannelHealth, 
  autoSwitchChannel,
  setCurrentChannel
} from './channelsSlice';

export const useChannels = () => {
  const dispatch = useAppDispatch();
  const { channels, currentChannelId, error, isLoading } = useAppSelector(
    (state) => state.channels
  );
  
  const currentChannel = channels.find((c) => c.id === currentChannelId);

  const checkCurrentChannel = () => {
    currentChannelId && dispatch(checkChannelHealth(currentChannelId));
  };

  const retryFailedChannels = () => {
    channels
      .filter((c) => c.status === 'unavailable')
      .forEach((channel) => {
        dispatch(checkChannelHealth(channel.id));
      });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      retryFailedChannels();
      checkCurrentChannel();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentChannelId]);

  useEffect(() => {
    if (error && error.includes('unavailable')) {
      dispatch(autoSwitchChannel());
    }
  }, [error, dispatch]);

  return {
    channels,
    currentChannel,
    error,
    isLoading,
    checkChannelHealth: (channelId: string) => dispatch(checkChannelHealth(channelId)),
    switchChannel: (channelId: string) => dispatch(setCurrentChannel(channelId)),
    retryFailedChannels,
  };
};