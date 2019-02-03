import cdk = require("@aws-cdk/cdk");
import fs = require("fs-extra");
import path = require("path");
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema
} from "@aws-cdk/aws-appsync";
import {
  Role,
  PolicyStatement,
  PolicyStatementEffect,
  ServicePrincipal
} from "@aws-cdk/aws-iam";

export class GraphQlApi extends cdk.Construct {
  public readonly graphQlApiApiId: string;
  public readonly serviceRole: Role;

  constructor(parent: cdk.Construct, name: string) {
    super(parent, name);

    const logsServiceRole = new Role(this, "GeminatorGraphQLLogsRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com")
    });

    logsServiceRole.addToPolicy(
      new PolicyStatement(PolicyStatementEffect.Allow)
        .addActions(
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        )
        .addResource("*")
    );

    const graphQlApi = new CfnGraphQLApi(this, "GeminatorGraphQLApi", {
      name: "GeminatorGraphQLApi",
      authenticationType: "API_KEY",
      logConfig: {
        cloudWatchLogsRoleArn: logsServiceRole.roleArn,
        fieldLogLevel: "ALL"
      }
    });

    const apiKey = new CfnApiKey(this, "DemoKey", {
      apiId: graphQlApi.graphQlApiApiId
    });

    new CfnGraphQLSchema(this, "GeminatorGraphQLSchema", {
      apiId: graphQlApi.graphQlApiApiId,
      definition: fs
        .readFileSync(path.join(__dirname, "schema.graphql"))
        .toString()
    });

    const lambdaServiceRole = new Role(this, "CMSGraphQLLambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com")
    });

    this.graphQlApiApiId = graphQlApi.graphQlApiApiId;
    this.serviceRole = lambdaServiceRole;

    new cdk.Output(this, "GraphQlApiUrl", {
      value: graphQlApi.graphQlApiGraphQlUrl
    });

    new cdk.Output(this, "GraphQlApiKey", {
      value: apiKey.apiKey
    });
  }
}
