import { Construct } from "monocdk-experiment";
import sns = require('monocdk-experiment/aws-sns');
import dynamo = require('monocdk-experiment/aws-dynamodb');
import sources = require('monocdk-experiment/aws-lambda-event-sources');
import { NodeFunction } from '../node-function';
import ids = require('./lambda/ids');
import { StartingPosition } from "monocdk-experiment/aws-lambda";

export interface DynamoTopicProps extends sns.TopicProps {
  /**
   * The source DynamoDB table.
   */
  readonly source: dynamo.Table;

  /**
   * Event types to include (other events will be dropped). Set to `[]` to disable the stream.
   *
   * @default - all event types
   */
  readonly events?: EventType[];
}

export enum EventType {
  INSERT = 'INSERT',
  MODIFY = 'MODIFY',
  REMOVE = 'REMOVE'
}

/**
 * A queue that is automatically populated with all updates to a DynamoDB table.
 */
export class DynamoTopic extends sns.Topic {

  constructor(scope: Construct, id: string, props: DynamoTopicProps) {
    super(scope, id, props);

    const events = props.events || [ EventType.INSERT, EventType.MODIFY, EventType.REMOVE ];

    // do not include any event, so we basically don't need any of this
    if (events.length === 0) {
      return;
    }

    const forwarder = new NodeFunction(this, 'Forwarder', {
      codeDirectory: __dirname + '/lambda',
      events: [
        new sources.DynamoEventSource(props.source, {
          startingPosition: StartingPosition.TRIM_HORIZON,
        })
      ],
      environment: {
        [ids.Environment.TOPIC_ARN]: this.topicArn,
        [ids.Environment.INCLUDE_EVENTS]: Array.from(new Set(events)).join(',')
      }
    });

    this.grantPublish(forwarder);
  }
}