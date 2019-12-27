import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import path = require("path");

export class CdkRubyBundlerLayer extends cdk.Construct {
  public readonly layer: lambda.ILayerVersion;

  constructor(parent: cdk.Construct, name: string) {
    super(parent, name);

    this.layer = new lambda.LayerVersion(this, "BundlerLayer", {
      code: lambda.Code.asset(path.join(__dirname, "../resources/layer")),
      compatibleRuntimes: [lambda.Runtime.RUBY_2_5],
      license: "Apache-2.0",
      description: "Layer which provides Ruby Bundler for Ruby 2.5 runtime"
    });
  }
}
