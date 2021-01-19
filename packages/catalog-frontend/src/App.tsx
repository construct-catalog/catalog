import React from 'react';
import PackageCard from './PackageCard';
import * as schema from 'catalog-schema';
import { Icon, Label, Input, InputOnChangeData } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import { searchByQuery } from './SearchApi';
import logo from './logo.png';
import { Image } from 'semantic-ui-react'

export class App extends React.Component<{}, { packages: schema.Package[], activePage: number }> {

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.state = { packages: [], activePage: 1 };
    this.search('');
  }

  public render() {

    const packages = this.state.packages;
    const cards = [];

    for (const i in packages) {
      const p = packages[i];
      cards.push(<PackageCard key={i} package={p}></PackageCard>)
    }

    const cardsPerRow = 'four';

    return (

      <Grid>
        <Grid.Row className="App-search" centered>
          <Image src={logo} alt="logo" size='small'></Image>
        </Grid.Row>
        <Grid.Row className="App-search" centered>
          <Input onChange={this.onSearchChange}/>
          <Label>
            <Icon name='numbered list'/> {packages.length}
          </Label>
        </Grid.Row>
        <Grid.Row className={`ui ${cardsPerRow} doubling stackable cards`}>
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
        this.setState({ packages: data })
      });
  }

}

export default App;
