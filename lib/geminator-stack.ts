import cdk = require("@aws-cdk/cdk");
import lambda = require("@aws-cdk/aws-lambda");
import { CdkRubyBundlerLayer } from "./ruby-bundler-layer";
import { GitProvider, GitProviderParameter } from "./git-provider";

export class GeminatorStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bundlerLayer = new CdkRubyBundlerLayer(this, "RubyBundlerLayer");
    this.createLambda(bundlerLayer.layer);
  }

  createLambda(layer: cdk.Resource) {
    const gitProviderToken = new GitProviderParameter(this, "Github", {
      provider: GitProvider.Github
    });

    const bundleUpdate = new lambda.Function(this, "BundleUpdate", {
      runtime: new lambda.Runtime("ruby2.5"),
      code: lambda.Code.asset("resources/bundle-update"),
      handler: "main.handler",
      environment: {
        GIT_PROVIDER: GitProvider.Github,
        PRIVATE_TOKEN: gitProviderToken.token
      },
      timeout: 180,
      memorySize: 512
    });

    new cdk.Output(this, "BundleUpdateLambda", {
      description: "Lambda ARN for Bundle Update",
      value: bundleUpdate.functionArn,
      disableExport: true
    });

    const functionResource = bundleUpdate.node.findChild(
      "Resource"
    ) as lambda.CfnFunction;
    functionResource.propertyOverrides.layers = [layer.ref];
  }
}
