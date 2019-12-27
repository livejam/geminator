#!/usr/bin/env node
import cdk = require("@aws-cdk/core");
import { GeminatorStack } from "../lib/geminator-stack";

const app = new cdk.App();
new GeminatorStack(app, "GeminatorStack");
