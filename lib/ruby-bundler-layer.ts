import cdk = require("@aws-cdk/cdk");
import lambda = require("@aws-cdk/aws-lambda");
import assets = require("@aws-cdk/assets");
import path = require("path");

export class CdkRubyBundlerLayer extends cdk.Construct {
  public readonly layer: cdk.Resource;

  constructor(parent: cdk.Construct, name: string) {
    super(parent, name);

    const asset = new assets.ZipDirectoryAsset(this, "BundlerLayerAsset", {
      path: path.join(__dirname, "../resources/layer")
    });

    this.layer = new cdk.Resource(this, "BundlerLayer", {
      type: "AWS::Lambda::LayerVersion",
      properties: {
        CompatibleRuntimes: [new lambda.Runtime("ruby2.5").toString()],
        Content: {
          S3Bucket: asset.s3BucketName,
          S3Key: asset.s3ObjectKey
        },
        Description: "Layer which provides Ruby Bundler for Ruby 2.5 runtime",
        LicenseInfo: "MIT"
      }
    });
  }
}
