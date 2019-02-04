import cdk = require("@aws-cdk/cdk");
import lambda = require("@aws-cdk/aws-lambda");
import { CdkRubyBundlerLayer } from "./ruby-bundler-layer";
import { GraphQlApi } from "./graphql-api";
import { GitProvider, GitProviderParameter } from "./git-provider";
import { CfnDataSource, CfnResolver } from "@aws-cdk/aws-appsync";

export class GeminatorStack extends cdk.Stack {
  public readonly graphQlApiUrl = "GraphQlApiUrl";

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bundlerLayer = new CdkRubyBundlerLayer(this, "RubyBundlerLayer");
    const graphQlApi = new GraphQlApi(this, "GraphQlApi");

    const gitProviderToken = new GitProviderParameter(this, "Github", {
      provider: GitProvider.Github
    });

    const bundleUpdate = this.createLambda(
      bundlerLayer.layer,
      gitProviderToken,
      "BundleUpdate",
      "main.handler"
    );

    this.createUpdateGraphQlHandler(bundleUpdate, graphQlApi);

    const bundleOutdated = this.createLambda(
      bundlerLayer.layer,
      gitProviderToken,
      "BundleOutdated",
      "outdated.handler"
    );

    this.createOutdatedGraphQlHandler(bundleOutdated, graphQlApi);
  }

  createLambda(
    layer: lambda.ILayerVersion,
    gitProviderToken: GitProviderParameter,
    name: string,
    handler: string
  ): lambda.IFunction {
    const bundleUpdate = new lambda.Function(this, name, {
      runtime: lambda.Runtime.Ruby25,
      code: lambda.Code.asset("resources/bundle-update"),
      handler: handler,
      environment: {
        GIT_PROVIDER: GitProvider.Github,
        PRIVATE_TOKEN: gitProviderToken.token
      },
      timeout: 180,
      memorySize: 512,
      layers: [layer]
    });

    return bundleUpdate;
  }

  createUpdateGraphQlHandler(
    handler: lambda.IFunction,
    graphqlApi: GraphQlApi
  ) {
    handler.grantInvoke(graphqlApi.serviceRole);

    const updateGemDataSource = new CfnDataSource(this, "UpdateGemDataSource", {
      name: "UpdateGem",
      type: "AWS_LAMBDA",
      apiId: graphqlApi.graphQlApiApiId,
      lambdaConfig: {
        lambdaFunctionArn: handler.functionArn
      },
      serviceRoleArn: graphqlApi.serviceRole.roleArn
    });

    new CfnResolver(this, "ArticlesPreviewResolver", {
      dataSourceName: updateGemDataSource.dataSourceName,
      apiId: graphqlApi.graphQlApiApiId,
      fieldName: "updateGem",
      typeName: "Mutation",
      requestMappingTemplate: `
      #set( $mappedArgs = {
        "gem_name": $context.arguments.input.gemName,
        "project" : $context.arguments.input.projectSlug
      } )

      {
        "version" : "2017-02-28",
        "operation": "Invoke",
        "payload": $util.toJson($mappedArgs)
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
  }

  createOutdatedGraphQlHandler(
    handler: lambda.IFunction,
    graphqlApi: GraphQlApi
  ) {
    handler.grantInvoke(graphqlApi.serviceRole);

    const outdatedGemsDataSource = new CfnDataSource(
      this,
      "OutdatedGemsDataSource",
      {
        name: "OutdatedGems",
        type: "AWS_LAMBDA",
        apiId: graphqlApi.graphQlApiApiId,
        lambdaConfig: {
          lambdaFunctionArn: handler.functionArn
        },
        serviceRoleArn: graphqlApi.serviceRole.roleArn
      }
    );

    new CfnResolver(this, "OutdatedGemsResolver", {
      dataSourceName: outdatedGemsDataSource.dataSourceName,
      apiId: graphqlApi.graphQlApiApiId,
      fieldName: "outdatedDependencies",
      typeName: "Query",
      requestMappingTemplate: `
      #set( $mappedArgs = {
        "project" : $context.arguments.projectSlug
      } )

      {
        "version" : "2017-02-28",
        "operation": "Invoke",
        "payload": $util.toJson($mappedArgs)
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`
    });
  }
}
