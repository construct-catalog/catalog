import React from 'react';
import PackageCard from './PackageCard';
import { Modules, Module } from './modules';
import { InputOnChangeData, Pagination, PaginationProps } from 'semantic-ui-react'
import { Input } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import logo from './logo.png';
import { Loader, Image } from 'semantic-ui-react'

const modules = new Modules();

const PAGE_SIZE = 16;

export class App extends React.Component<{}, { packages: Module[], activePage: number }> {

  private _loading: boolean;

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this._loading = true;
    this.state = { packages: [], activePage: 1 };
  }

  public render() {

    const packages = this.state.packages;
    const activePage = this.state.activePage;
    const packagesInPage = [];

    const start = (activePage - 1) * PAGE_SIZE;

    for (const module of packages.slice(start, Math.min(start + PAGE_SIZE, packages.length))) {
      packagesInPage.push(module);
    }

    const totalPages = Math.ceil(packages.length / PAGE_SIZE);
    const cards = [];

    for (const i in packagesInPage) {
      cards.push(<PackageCard key={i}  module={packagesInPage[i]}></PackageCard>)
    }

    const cardsPerRow = 'five';

    return (

      <Grid>
        <Grid.Row className="App-search" centered>
          <Image src={logo} alt="logo" size='small'></Image>
        </Grid.Row>
        <Grid.Row className="App-search" centered>
          <Input onChange={this.onSearchChange} placeholder='Search...'/>
        </Grid.Row>
        <Grid.Row centered>
          <Pagination totalPages={totalPages} onPageChange={this.onPageChange}/>
        </Grid.Row>
        <Grid.Row className={`ui ${cardsPerRow} doubling stackable cards`}>
          {this._loading ? <Loader active inline='centered' /> : cards}
        </Grid.Row>
      </Grid>

    );

  }

  private onSearchChange(event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) {
    const packages = modules.search(data.value);
    this.setState({ packages: packages })
  }

  private onPageChange(event: React.MouseEvent<HTMLAnchorElement>, data: PaginationProps) {
    this.setState({ activePage: data.activePage as number });
  }

  private search(q: string) {
    this._loading = true;
  }

}

export default App;
