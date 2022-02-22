import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './App';
import { Toaster } from 'react-hot-toast';

ReactDOM.render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        // Define default options
        className: 'toast',
        duration: 5000,
        style: {
          background: '#3a7bd5',
          color: '#fff',
        },
      }}
    />
  </React.StrictMode>,
  document.getElementById('root')
);