import React from 'react';
import PackageCard from './PackageCard';
import * as schema from 'catalog-schema';
import { Icon, Label, Input, InputOnChangeData } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import { searchByQuery, getTotalCount } from './SearchApi';
import logo from './logo.png';
import './App.css';
import { Image } from 'semantic-ui-react'

export class App extends React.Component<{}, { packages: schema.Package[], activePage: number, count: number }> {

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.state = { packages: [], activePage: 1, count: 0 };
    this.search('');
    getTotalCount().then(count => this.setState({...this.state, count}))
  }

  public render() {

    const packages = this.state.packages;
    const cards = [];

    for (const i in packages) {
      const p = packages[i];
      cards.push(<PackageCard key={i} package={p}></PackageCard>)
    }

    const cardsPerRow = 'three';

    return (

      <Grid padded>
        <Grid.Row className="App-search" centered>
          <Image src={logo} alt="logo" size='small'></Image>
        </Grid.Row>
        <Grid.Row className="App-search" centered>
          <Input onChange={this.onSearchChange}/>
          <Label className="v-middle">
            <Icon name='numbered list'/> {packages.length}/{this.state.count}
          </Label>
        </Grid.Row>
        <Grid.Row className={`ui ${cardsPerRow} doubling stackable cards container`}>
          {cards}
        </Grid.Row>
      </Grid>

    );

  }

  private onSearchChange(event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) {
    this.search(data.value);
  }

  private search(q: string) {
    searchByQuery(q)
      .then(data => {
        this.setState({ ...this.state, packages: data });
      });
  }

}

export default App;
