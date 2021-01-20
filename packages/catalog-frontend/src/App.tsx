import React from 'react';
import PackageCard from './PackageCard';
import * as schema from 'catalog-schema';
import { Container, Header, Image, Input, InputOnChangeData, Segment } from 'semantic-ui-react'
import { Grid } from 'semantic-ui-react'
import { searchByQuery, getTotalCount } from './SearchApi';
import GithubCorner from 'react-github-corner';
import logo from './logo.png';

export class App extends React.Component<{}, { packages: schema.Package[], activePage: number, count: number }> {

  constructor(props: any) {
    super(props);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.state = { packages: [], activePage: 1, count: 0 };
    this.search('');
    getTotalCount().then(count => this.setState({ ...this.state, count }))
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
      <Container fluid>
        <Segment basic>
          <GithubCorner href="https://github.com/construct-catalog/catalog" />
          <Grid padded>
            <Grid.Row centered>
              <Container>
                <Header size="large">
                  <Image src={logo} style={{ width: '2.5rem', height: '2.5rem', top: '-0.3rem' }} aria-hidden='true' />
                  CDK Construct Catalog
                </Header>
              </Container>
            </Grid.Row>
            <Grid.Row centered>
              <Container>
                <Input
                  size='large'
                  icon='search'
                  fluid
                  placeholder='Search construct libraries...'
                  onChange={this.onSearchChange}
                  label={{ content: `${new Set(packages.map(pkg => pkg.name)).size} packages`, color: 'teal' }}
                  labelPosition="left" />
              </Container>

            </Grid.Row>
            <Grid.Row className={`ui ${cardsPerRow} doubling stackable cards container`}>
              {cards}
            </Grid.Row>
          </Grid>
        </Segment>

        <Segment basic inverted vertical style={{ padding: '5em 0em' }}>
          <Container>
            <Grid divided inverted stackable>
              <Grid.Row centered>
                  <Header inverted>
                  This is a community project <span role="img" aria-hidden>❤️</span> and is not supported by AWS
                  </Header>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      </Container>
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
