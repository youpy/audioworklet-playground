import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

const getId = () => {
  const url = new URL(window.location.href);
  let id;

  if (url.pathname.match(/^\/w\/([0-9a-z]+)/)) {
    id = RegExp.$1
  };
};

ReactDOM.render(<App id={getId()} />, document.getElementById('root'));
