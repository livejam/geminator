import cdk = require("@aws-cdk/cdk");

export enum GitProvider {
  Github = "Github",
  Gitlab = "Gitlab"
}

interface GitParameter {
  provider: GitProvider;
}

export class GitProviderParameter extends cdk.Construct {
  public readonly token: cdk.Secret;

  constructor(parent: cdk.Construct, name: string, props: GitParameter) {
    super(parent, name);

    const accessToken = new cdk.SecretParameter(
      this,
      `${props.provider}Token`,
      {
        ssmParameter: `/CDK/${props.provider}Token`
      }
    );

    this.token = accessToken.value;
  }
}
