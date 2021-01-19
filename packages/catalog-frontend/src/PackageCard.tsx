import React from 'react'
import * as schema from 'catalog-schema';
import { Card, Icon } from 'semantic-ui-react'

export interface PackageCardProps {
  readonly package: schema.Package;
}

export class PackageCard extends React.Component<PackageCardProps, {}> {

  public render() {

    const languages = ['typescript', 'javascript'];

    if (this.props.package.languages?.dotnet) {
      languages.push('dotnet');
    }

    if (this.props.package.languages?.go) {
      languages.push('go');
    }

    if (this.props.package.languages?.java) {
      languages.push('java');
    }

    if (this.props.package.languages?.python) {
      languages.push('python');
    }

    const date = new Date((this.props.package.metadata as any).date).toDateString();

    return (
      <Card link raised href={this.props.package.url}>
        <Card.Content>
          <Card.Header>{this.props.package.name}@{this.props.package.version}</Card.Header>
          <Card.Meta>
            <span className='date'>Last published: {date}</span>
          </Card.Meta>
          <Card.Description>
            {this.props.package.metadata.description}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Icon name='language'/>{languages.join(' | ')}
        </Card.Content>
      </Card>
    )
  }
}

export default PackageCard;