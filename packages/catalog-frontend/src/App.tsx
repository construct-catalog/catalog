import React from 'react';
import PackageCard from './PackageCard';
import * as schema from 'catalog-schema';
import { Icon, Label, Input, InputOnChangeData, Pagination, PaginationProps } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import { searchByQuery } from './SearchApi';
import logo from './logo.png';
import { Image } from 'semantic-ui-react'

const PAGE_SIZE = 16;

export class App extends React.Component<{}, { packages: schema.Package[], activePage: number }> {

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.state = { packages: [], activePage: 1 };
    this.search('');
  }

  public render() {

    const packages = this.state.packages;
    const activePage = this.state.activePage;
    const packagesInPage = [];

    const start = (activePage - 1) * PAGE_SIZE;

    for (const p of packages.slice(start, Math.min(start + PAGE_SIZE, packages.length))) {
      packagesInPage.push(p);
    }

    const totalPages = Math.ceil(packages.length / PAGE_SIZE);
    const cards = [];

    for (const i in packagesInPage) {
      const p = packagesInPage[i];
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
        </Grid.Row>
        <Grid.Row centered>
          <Pagination totalPages={totalPages} onPageChange={this.onPageChange}/>
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

  private onPageChange(event: React.MouseEvent<HTMLAnchorElement>, data: PaginationProps) {
    this.setState({ activePage: data.activePage as number });
  }

  private search(q: string) {
    searchByQuery(q)
      .then(data => {
        this.setState({ packages: data })
      });
  }

}

export default App;
