import React from 'react'
import * as schema from 'catalog-schema';
import { Card, Icon, Label } from 'semantic-ui-react'

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

    const date = new Date(this.props.package.metadata.date).toLocaleDateString();

    return (
      <Card raised>
        <Card.Content link href={this.props.package.url}>
          <Card.Header className='package-name'>
            {this.props.package.name} <Label tag size='small' aria-label='Major Version'>{this.props.package.major}.x</Label>
            <Label attached='top right' aria-label='Latest Version'>{this.props.package.version}</Label>
          </Card.Header>
          <Card.Meta>
            <span className='date'>Last published: {date}</span>
          </Card.Meta>
          <Card.Description aria-label='Package description'>
            {this.props.package.metadata.description}
          </Card.Description>
        </Card.Content>
        <Card.Content extra aria-label='Keywords'>
          {(this.props.package.metadata.keywords || [])?.sort().map(kw => (<Label>{kw}</Label>))}
        </Card.Content>
        <Card.Content extra aria-label='Supported Languages'>
          <SupportedLanguageList config={this.props.package.languages} />
        </Card.Content>
      </Card>
    )
  }
}

class SupportedLanguageList extends React.Component<{config: schema.LanguageSupportInformation | undefined}, {}> {
  public render() {
    const items = new Array<React.ReactElement>();

    items.push(
      <Label basic as='a' href={this.props.config?.typescript.url} target='_blank' rel='noopener noreferrer'>
        <Icon name='js' color='yellow' aria-hidden='true' /> TypeScript / Javascript
      </Label>
    );

    if (this.props.config?.dotnet) {
      items.push(
        <Label basic as='a' href={this.props.config.dotnet.url} target='_blank' rel='noopener noreferrer'>
          <Icon name='microsoft' color='blue' aria-hidden='true' /> .NET
        </Label>
      );
    }
    if (this.props.config?.go) {
      items.push(
        <Label basic as='a' href={this.props.config.go.url} target='_blank' rel='noopener noreferrer'>
          <Icon name='file code' aria-hidden='true'/> Go
        </Label>
      );
    }
    if (this.props.config?.java) {
      items.push(
        <Label basic as='a' href={this.props.config.java.url} target='_blank' rel='noopener noreferrer'>
          <Icon name='coffee' color='red' aria-hidden='true' /> Java
        </Label>
      );
    }
    if (this.props.config?.python) {
      items.push(
        <Label basic as='a' href={this.props.config.python.url} target='_blank' rel='noopener noreferrer'>
          <Icon name='python' color='orange' aria-hidden='true' /> Python
        </Label>
      );
    }

    return (
      <Label.Group as='span'>{items}</Label.Group>
    );
  }
}

export default PackageCard;
