#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HyperPushStack } from "../lib/hyperpush-stack";

const app = new cdk.App();
new HyperPushStack(app, "HyperPushStack", {
  env: {
    region: process.env.AWS_REGION || "ap-southeast-1",
  },
  description: "HyperPush — CodePush Universal Management Console",
});
