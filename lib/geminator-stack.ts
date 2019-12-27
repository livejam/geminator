import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import { CdkRubyBundlerLayer } from "./ruby-bundler-layer";
import { CustomGraphQlApi } from "./graphql-api";
import { GitProvider, GitProviderParameter } from "./git-provider";
import { LambdaDataSource, Resolver, GraphQLApi, MappingTemplate } from "@aws-cdk/aws-appsync";

export class GeminatorStack extends cdk.Stack {
  public readonly graphQlApiUrl = "GraphQlApiUrl";

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bundlerLayer = new CdkRubyBundlerLayer(this, "RubyBundlerLayer");
    const graphQlApi = new CustomGraphQlApi(this, "GraphQlApi");

    const gitProviderToken = new GitProviderParameter(this, "Github", {
      provider: GitProvider.Github
    });

    const bundleUpdate = this.createLambda(
      bundlerLayer.layer,
      gitProviderToken,
      "BundleUpdate",
      "main.handler"
    );

    this.createUpdateGraphQlHandler(bundleUpdate, graphQlApi.graphQlApiApi);

    const bundleOutdated = this.createLambda(
      bundlerLayer.layer,
      gitProviderToken,
      "BundleOutdated",
      "outdated.handler"
    );

    this.createOutdatedGraphQlHandler(bundleOutdated, graphQlApi.graphQlApiApi);
  }
 
  createLambda(
    layer: lambda.ILayerVersion,
    gitProviderToken: GitProviderParameter,
    name: string,
    handler: string
  ): lambda.IFunction {
    const bundleUpdate = new lambda.Function(this, name, {
      runtime: lambda.Runtime.RUBY_2_5,
      code: lambda.Code.asset("resources/bundle-update"),
      handler: handler,
      environment: {
        GIT_PROVIDER: GitProvider.Github,
        PRIVATE_TOKEN: gitProviderToken.token
      },
      timeout: cdk.Duration.seconds(180),
      memorySize: 512,
      layers: [layer]
    });

    return bundleUpdate;
  }

  createUpdateGraphQlHandler(
    handler: lambda.IFunction,
    graphqlApi: GraphQLApi
  ) { 

    const updateGemDataSource = new LambdaDataSource(this, "UpdateGemDataSource", {
        name: "UpdateGem",
        api: graphqlApi,
        lambdaFunction: handler
      }
    );

    const foo = MappingTemplate.fromString(`
    #set( $mappedArgs = {
      "gem_name": $context.arguments.input.gemName,
      "project" : $context.arguments.input.projectSlug
    } )

    {
      "version" : "2017-02-28",
      "operation": "Invoke",
      "payload": $util.toJson($mappedArgs)
    }`)

    const bar = MappingTemplate.fromString(`$util.toJson($ctx.result)`)

    new Resolver(this, "ArticlesPreviewResolver", {
      dataSource: updateGemDataSource,
      api: graphqlApi,
      fieldName: "updateGem",
      typeName: "Mutation",
      requestMappingTemplate: foo,
      responseMappingTemplate: bar
    });
  }

  createOutdatedGraphQlHandler(
    handler: lambda.IFunction,
    graphqlApi: GraphQLApi
  ) {

    const outdatedGemDatasource = new LambdaDataSource(this, "outdatedGemDatasource", {
      name: "OutdatedGemsDataSource",
      api: graphqlApi,
      lambdaFunction: handler
    }
  );  

    const foo = MappingTemplate.fromString( `
    #set( $mappedArgs = {
      "project" : $context.arguments.projectSlug
    } )

    {
      "version" : "2017-02-28",
      "operation": "Invoke",
      "payload": $util.toJson($mappedArgs)
    }`)

    const bar = MappingTemplate.fromString(`$util.toJson($ctx.result)`)

    new Resolver(this, "OutdatedGemsResolver", {
      dataSource: outdatedGemDatasource,
      api: graphqlApi,
      fieldName: "outdatedDependencies",
      typeName: "Query",
      requestMappingTemplate: foo,
      responseMappingTemplate: bar
    });
  }
}
