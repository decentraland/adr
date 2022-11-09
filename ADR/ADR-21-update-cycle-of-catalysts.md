---
layout: doc
adr: 21
date: 2020-12-14
title: Update cycle of catalysts
status: Stagnant
authors:
- menduz
- HPrivakos
type: Standards Track
spdx-license: CC0-1.0
---

Since catalyst servers are bound to a persistent volumes, a deployment schema where we delete the machine and create another (new) one is not a viable choice without downtime.

Instead, we will use the catalyst-owner/init.sh script to update the current version in every machine. To know where to update we will create two SNS topics that will be redirected to SQS queues (one for each deployment):

- `arn:aws:sns:us-east-1:619079673649:decentraland-catalyst-stable-version` for stable and tagged releases (official versions)

- `arn:aws:sns:us-east-1:619079673649:decentraland-catalyst-latest-version` for master branch versions (dev)

Every deployment will have a 1 minute crontab to pull messages of its own SQS

1. Create an SNS topic to publish new versions of the catalysts

2. In each catalyst deployment (EC2)  

   1. create also an SQS

   2. subscribe that SQS to the SNS topic

   3. crontab to consume the SQS in each deployment

```mermaid
sequenceDiagram
  ci->>sns: new version published (using aws cli)
  sns->>sqs: aws.sns.TopicSubscription
  ec2->>ec2: cron (aws sqs receive-message)
  sqs-->>ec2: message
  ec2->>ec2: ./init.sh
  ec2-->>sqs: delete-message (if succeed)
```

## Links

- Properly receive SQS messages with `aws cli` https://advancedweb.hu/how-to-use-the-aws-sqs-cli-to-receive-messages/

- Create SQS with pulumi https://www.pulumi.com/docs/reference/pkg/aws/sqs/queue/

- Subscribe SQS to SNS with pulumi: https://www.pulumi.com/docs/reference/pkg/aws/sns/topicsubscription/

