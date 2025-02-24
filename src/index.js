import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Provider } from "react-redux";
import store from "./redux/store.jsx"; // Importing the default export from store.jsx

const root = ReactDOM.createRoot(document.getElementById('root'));

// Wrapping the app with ThemeProvider and React.StrictMode
root.render(
  <Provider store={store}>

  <React.StrictMode>
    <App />
  </React.StrictMode>
  </Provider>



);

// Measure app performance
reportWebVitals();
