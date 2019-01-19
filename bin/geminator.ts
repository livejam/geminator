#!/usr/bin/env node
import cdk = require("@aws-cdk/cdk");
import { GeminatorStack } from "../lib/geminator-stack";

const app = new cdk.App();
new GeminatorStack(app, "GeminatorStack");
app.run();
