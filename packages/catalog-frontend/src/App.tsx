import React from 'react';
import Home from './Home';
import Search from './Search';
import { Route, Switch } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  return (

    <main>
        <Switch>
          <Route path='/' component={Home} exact/>
          <Route path='/_search' component={Search} exact/>
        </Switch>
    </main>
  );
}

export default App;
