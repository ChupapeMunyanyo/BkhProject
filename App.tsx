import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import ChannelStatus from './ChannelStatus';
import { ToastContainer } from 'react-toastify';
import './global.css'

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <ChannelStatus />
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </Provider>
  );
};

export default App;