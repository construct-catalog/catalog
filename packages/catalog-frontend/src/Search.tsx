import React from 'react';
import ModuleCard from './ModuleCard';
import { Modules } from './modules';
import { InputOnChangeData, Pagination, PaginationProps } from 'semantic-ui-react'
import { Input } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'

const modules = new Modules();

const PAGE_SIZE = 16;

export class Search extends React.Component {

  readonly inputRef: any;

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
  }

  public render() {

    const query = this.getState('query') ?? '';
    const activePage = this.getState('activePage') ?? 1;

    const allModules = modules.search(query);
    const currentModules = [];

    const start = (activePage - 1) * PAGE_SIZE;

    for (const module of allModules.slice(start, Math.min(start + PAGE_SIZE, allModules.length))) {
      currentModules.push(module);
    }

    const totalResults = allModules.length;
    const totalPages = Math.ceil(totalResults / PAGE_SIZE);
    const cards = [];

    for (const module of currentModules) {
      cards.push(<ModuleCard module={module}></ModuleCard>)
    }

    return (

      <Grid>
        <Grid.Row className="App-search" centered>
          <Input onChange={this.onSearchChange} placeholder='Search...'/>
        </Grid.Row>
        <Grid.Row centered>
          <Pagination totalPages={totalPages} onPageChange={this.onPageChange}/>
        </Grid.Row>
        <Grid.Row className="ui five doubling stackable cards">
          {cards}
        </Grid.Row>
      </Grid>

    );

  }

  private onSearchChange(event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) {
    this.setState({ query: data.value })
  }

  private onPageChange(event: React.MouseEvent<HTMLAnchorElement>, data: PaginationProps) {
    this.setState({ activePage: data.activePage as number });

  }

  private getState(attr: string) {
    return this.state ? (this.state as any)[attr] : undefined;
  }

}

export default Search;
