import React from 'react';
import SearchForm from './SearchForm';
import GithubCorner from 'react-github-corner';
import logo from './logo.png';
import './App.css';

const Home: React.FC = () => {
  return (

    <div className="App">
      <section className="App-header">
        <h1>CDK Construct Catalog</h1>
        <img src={logo} alt="logo" />
        <p>A catalog of AWS CDK construct libraries.</p>
      </section>

      <section className="App-search">
        <SearchForm></SearchForm>
      </section>

      <section className="App-disclaimer">
        <p>This is a community project and is not supported by AWS</p>
      </section>

      <GithubCorner href="https://github.com/construct-catalog/catalog" />
    </div>
  );
}

export default Home;
