import React from 'react'
import moment from 'moment';
import { Module } from './modules';
import { Card, Icon } from 'semantic-ui-react'

const ModuleCard = (props: { module: Module }) => {
  return <Card>
    <Card.Content>
    <Card.Header>{props.module.name}</Card.Header>
    <Card.Meta>
      <span className='date'>Last published: {moment(props.module.lastPublished).format('DD MMM YYYY')} | Version: {props.module.version}</span>
    </Card.Meta>
    <Card.Description>
      {props.module.description}
    </Card.Description>
  </Card.Content>
  <Card.Content extra>
      <Icon name='language'/>{props.module.languages.join(' | ')}
  </Card.Content>
</Card>

}

export default ModuleCard