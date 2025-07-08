#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SofttekBackendStack } from '../lib/softtek-backend-stack';

const app = new cdk.App();

// Obtener el stage del contexto (dev, prod) o usar 'poc' por defecto
const stage = app.node.tryGetContext('stage') ?? 'poc';

const stack = new SofttekBackendStack(app, `SofttekBackendStack-${stage}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  stackName: `softtek-backend-challenge-${stage}`,
  description: `Softtek Backend Challenge - ${stage.toUpperCase()} environment`,
  tags: {
    Project: 'SofttekBackendChallenge',
    Environment: stage,
    Owner: 'SofttekTeam',
    CostCenter: 'Development',
  },
});

// Usar el stack para evitar warning
console.log(`Created stack: ${stack.stackName}`);
