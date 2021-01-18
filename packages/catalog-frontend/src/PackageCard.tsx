import React from 'react'
import moment from 'moment';
import { Module } from './modules';
import { Card, Icon } from 'semantic-ui-react'

export interface PackageCardProps {
  readonly module: Module;
}

export class PackageCard extends React.Component<PackageCardProps, {}> {

  private readonly module: Module;

  constructor(props: PackageCardProps) {
    super(props);
    this.module = props.module;
  }

  public render() {
    return (
      <Card>
        <Card.Content>
          <Card.Header>{this.module.name}</Card.Header>
          <Card.Meta>
            <span className='date'>Last published: {moment(this.module.lastPublished).format('DD MMM YYYY')} | Version: {this.module.version}</span>
          </Card.Meta>
          <Card.Description>
            {this.module.description}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Icon name='language'/>{this.module.languages.join(' | ')}
        </Card.Content>
      </Card>
    )
  }
}

export default PackageCard;