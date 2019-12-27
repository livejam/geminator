import cdk = require("@aws-cdk/core");
import fs = require("fs-extra");
import path = require("path");
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema,
  GraphQLApi  
} from "@aws-cdk/aws-appsync";
import {
  Role,
  PolicyStatement,
  ServicePrincipal
} from "@aws-cdk/aws-iam";

export class CustomGraphQlApi extends cdk.Construct {
  public readonly graphQlApiApiId: string;
  public readonly serviceRole: Role;
  public readonly graphQlApiApi: GraphQLApi;

  constructor(parent: cdk.Construct, name: string) {
    super(parent, name);

    const logsServiceRole = new Role(this, "GeminatorGraphQLLogsRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com")
    });

    logsServiceRole.addToPolicy(
      new PolicyStatement({      
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources: ["*"]
      })
    );

    const graphQlApi = new GraphQLApi(this, "GeminatorGraphQLApi", {
      name: "GeminatorGraphQLApi",
      schemaDefinitionFile: path.join(__dirname, "schema.graphql")
    });

    const apiKey = new CfnApiKey(this, "DemoKey", {
      apiId: graphQlApi.apiId
    });
  
    const lambdaServiceRole = new Role(this, "CMSGraphQLLambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com")
    });

    this.graphQlApiApiId = graphQlApi.apiId;
    this.serviceRole = lambdaServiceRole;
    this.graphQlApiApi = graphQlApi

    new cdk.CfnOutput(this, "GraphQlApiUrl", {
      value: graphQlApi.graphQlUrl
    });

    new cdk.CfnOutput(this, "GraphQlApiKey", {
      value: apiKey.attrApiKey
    });
  }
}
