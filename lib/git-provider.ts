import cdk = require("@aws-cdk/core");
import ssm = require('@aws-cdk/aws-ssm');

export enum GitProvider {
  Github = "Github",
  Gitlab = "Gitlab"
}

interface GitParameter {
  provider: GitProvider;
}

export class GitProviderParameter extends cdk.Construct {
  public readonly token: string;

  constructor(parent: cdk.Construct, name: string, props: GitParameter) {
    super(parent, name);

    const accessToken = ssm.StringParameter.valueForStringParameter(
      this, `/CDK/${props.provider}Token`
    );

    this.token = accessToken;
  }
}
