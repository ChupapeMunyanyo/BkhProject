import React, { useEffect, useState } from 'react';
import { useAppDispatch } from './hooks';
import { setChannels } from './channelsSlice';
import { useChannels } from './useChannels';
import { toast } from 'react-toastify';
import { Channel } from './types';

const initialChannels: Channel[] = [
  {
    id: 'stable-api',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    status: 'idle',
    priority: 1,
    lastChecked: null,
    retryCount: 0
  },
  {
    id: 'always-ok',
    url: 'https://httpstat.us/200',
    status: 'idle',
    priority: 2,
    lastChecked: null,
    retryCount: 0
  },
  {
    id: 'test-failure',
    url: 'https://httpstat.us/500',
    status: 'idle',
    priority: 3,
    lastChecked: null,
    retryCount: 0,
    isTestError: true
  }
];

const ChannelStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { channels, currentChannel, error, isLoading, switchChannel } = useChannels();
  const [lastErrorTime, setLastErrorTime] = useState<number | null>(null);

  useEffect(() => {
    dispatch(setChannels(initialChannels));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      if (!lastErrorTime || Date.now() - lastErrorTime > 5000) {
        toast.error(error);
        setLastErrorTime(Date.now());
      }
    }
  }, [error, lastErrorTime]);

  const displayChannels = channels.map(channel => ({
    ...channel,
    error: channel.isTestError ? 'Тестовая ошибка (ожидаемо)' : channel.error
  }));

  return (
    <div className="channel-status">
      <h2>Connection Status</h2>
      <div className="current-channel">
        <h3>Current: {currentChannel?.id || 'None'}</h3>
        <p>Status: {currentChannel?.status || 'unknown'}</p>
        {isLoading && (
          <div className="health-check">
            <span className="spinner"></span>
            <span>Checking health...</span>
          </div>
        )}
      </div>
      
      <div className="channel-list">
        <h3>Available Channels:</h3>
        <ul>
          {displayChannels.map((channel) => (
            <li key={channel.id} className={`channel-item ${channel.status}`}>
              <button
                onClick={() => switchChannel(channel.id)}
                disabled={channel.status === 'unavailable' || channel.id === currentChannel?.id}
                className={channel.isTestError ? 'test-error' : ''}
              >
                {channel.id} ({channel.status})
              </button>
              {channel.error && (
                <span className="error-message">
                  {channel.error}
                  {channel.isTestError && ' ⚠️ Это тестовая ошибка'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChannelStatus;