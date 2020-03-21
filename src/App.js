import React from 'react';
import logo from './logo.svg';
import ExtensionService from './libs/extensionService'
import './styles/App.css';


const locationJump = ()=> {
  window.location.href = "https://google.com"
}


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={ExtensionService.getResourceUrl(logo)} className="App-logo" alt="logo" />
        <p className="App-p">
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={locationJump}>別のページにいく</button>
      </header>
    </div>
  );
}

export default App;
