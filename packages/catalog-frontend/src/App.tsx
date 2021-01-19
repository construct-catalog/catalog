import React from 'react';
import PackageCard from './PackageCard';
import * as schema from 'catalog-schema';
import { Form, Icon, Image, Input, InputOnChangeData, Label } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import { searchByQuery, getTotalCount } from './SearchApi';
import './App.css';
import logo from './logo.png';

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
          <h1>
            <Image src={logo} style={{ width: '3rem', height: '3rem' }} aria-hidden='true' floated='left' /> CDK Constructs Catalog
          </h1>
        </Grid.Row>
        <Grid.Row className="App-search" centered>
          <Form>
            <Form.Field>
              <Input icon='search' iconPosition='left' placeholder='Search...' onChange={this.onSearchChange} />
              <Label pointing='above' color='blue'>
                <Icon name='box' aria-hidden='true'/>
                {new Set(packages.map(pkg => pkg.name)).size} packages selected
              </Label>
            </Form.Field>
          </Form>
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
