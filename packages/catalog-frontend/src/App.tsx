import React from 'react';
import Home from './Home';
import { Route, Switch } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  return (

    <main>
        <Switch>
          <Route path='/' component={Home} />
        </Switch>
    </main>
  );
}

export default App;
