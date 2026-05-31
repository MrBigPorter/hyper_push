import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class HyperPushStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    //  VPC — 2 AZs, no NAT Gateway (cost saving)
    // ============================================
    const vpc = new ec2.Vpc(this, "HyperPushVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ============================================
    //  ECR — Docker image repositories
    // ============================================
    const appRepo = new ecr.Repository(this, "HyperPushAppRepo", {
      repositoryName: "hyperpush-app",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        { maxImageCount: 10, rulePriority: 1 },
      ],
    });

    const frontendRepo = new ecr.Repository(this, "HyperPushFrontendRepo", {
      repositoryName: "hyperpush-frontend",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        { maxImageCount: 10, rulePriority: 1 },
      ],
    });

    // ============================================
    //  Secrets Manager — store app secrets
    // ============================================
    const appSecret = new secretsmanager.Secret(this, "HyperPushSecret", {
      secretName: "hyperpush/app",
      description: "HyperPush app secrets (JWT_SECRET, TOKEN_SECRET, etc.)",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: "placeholder",
          TOKEN_SECRET: "placeholder",
        }),
        generateStringKey: "placeholder",
        excludePunctuation: true,
      },
    });

    // ============================================
    //  RDS PostgreSQL — HyperPush metadata DB
    // ============================================
    const dbSg = new ec2.SecurityGroup(this, "HyperPushDbSg", {
      vpc,
      description: "PostgreSQL access from ECS",
      allowAllOutbound: true,
    });

    const db = new rds.DatabaseInstance(this, "HyperPushDb", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO,
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      databaseName: "hyperpush",
      credentials: rds.Credentials.fromGeneratedSecret("hyperpush", {
        secretName: "hyperpush/db-credentials",
      }),
      multiAz: false,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================
    //  ECS Cluster
    // ============================================
    const cluster = new ecs.Cluster(this, "HyperPushCluster", {
      vpc,
      clusterName: "hyperpush-cluster",
      containerInsights: true,
    });

    // ============================================
    //  ALB Security Group
    // ============================================
    const albSg = new ec2.SecurityGroup(this, "HyperPushAlbSg", {
      vpc,
      description: "ALB — HTTP/HTTPS from internet",
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "HTTP");
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "HTTPS");

    // ECS Security Group — allow traffic from ALB
    const ecsSg = new ec2.SecurityGroup(this, "HyperPushEcsSg", {
      vpc,
      description: "ECS — traffic from ALB only",
      allowAllOutbound: true,
    });
    ecsSg.connections.allowFrom(albSg, ec2.Port.tcp(3000), "From ALB");
    dbSg.connections.allowFrom(ecsSg, ec2.Port.tcp(5432), "From ECS");

    // ============================================
    //  ALB — Application Load Balancer
    // ============================================
    const alb = new elbv2.ApplicationLoadBalancer(this, "HyperPushAlb", {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      loadBalancerName: "hyperpush-alb",
    });

    // ACM Certificate (requires DNS validation — user must create Route53 records)
    const consoleCert = new acm.Certificate(this, "HyperPushConsoleCert", {
      domainName: `console.${this.node.tryGetContext("domain") || "example.com"}`,
      validation: acm.CertificateValidation.fromDns(),
    });

    const codepushCert = new acm.Certificate(this, "HyperPushCodepushCert", {
      domainName: `codepush.${this.node.tryGetContext("domain") || "example.com"}`,
      validation: acm.CertificateValidation.fromDns(),
    });

    // HTTP:80 → HTTPS redirect
    const httpListener = alb.addListener("HttpListener", {
      port: 80,
      open: true,
    });
    httpListener.addAction("RedirectHttps", {
      action: elbv2.ListenerAction.redirect({
        protocol: "HTTPS",
        port: "443",
        permanent: true,
      }),
    });

    // HTTPS:443 listeners
    const httpsListener = alb.addListener("HttpsListener", {
      port: 443,
      open: true,
      certificates: [consoleCert],
    });

    // ============================================
    //  ECS Task Execution Role
    // ============================================
    const executionRole = new iam.Role(this, "HyperPushEcsExecRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy",
        ),
      ],
    });
    appSecret.grantRead(executionRole);

    // ============================================
    //  Fargate Task Definition — Backend (app)
    // ============================================
    const appTaskDef = new ecs.FargateTaskDefinition(this, "HyperPushAppTaskDef", {
      family: "hyperpush-app",
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole,
    });

    const appContainer = appTaskDef.addContainer("HyperPushApp", {
      image: ecs.ContainerImage.fromEcrRepository(appRepo, "latest"),
      containerName: "app",
      memoryLimitMiB: 512,
      cpu: 256,
      environment: {
        NODE_ENV: "production",
        PORT: "3000",
        PUBLIC_URL: `https://${this.node.tryGetContext("CODEPUSH_DOMAIN") || "codepush.example.com"}`,
      },
      secrets: {
        JWT_SECRET: ecs.Secret.fromSecretsManager(appSecret, "JWT_SECRET"),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "hyperpush-app",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "wget -qO- --post-data='{\"query\":\"{_health}\"}' --header='Content-Type: application/json' http://localhost:3000/graphql >/dev/null 2>&1 || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });
    appContainer.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // ============================================
    //  Fargate Service — Backend
    // ============================================
    const appService = new ecs.FargateService(this, "HyperPushAppService", {
      cluster,
      taskDefinition: appTaskDef,
      serviceName: "hyperpush-app",
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      desiredCount: 1,
      enableExecuteCommand: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
    });

    // Auto Scaling
    const appScaling = appService.autoScaleTaskCount({
      maxCapacity: 3,
      minCapacity: 1,
    });
    appScaling.scaleOnCpuUtilization("AppCpuScaling", {
      targetUtilizationPercent: 70,
    });

    // ============================================
    //  Fargate Task Definition — Frontend (Nginx)
    // ============================================
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, "HyperPushFrontendTaskDef", {
      family: "hyperpush-frontend",
      memoryLimitMiB: 256,
      cpu: 128,
      executionRole,
    });

    const frontendContainer = frontendTaskDef.addContainer("HyperPushFrontend", {
      image: ecs.ContainerImage.fromEcrRepository(frontendRepo, "latest"),
      containerName: "frontend",
      memoryLimitMiB: 256,
      cpu: 128,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "hyperpush-frontend",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
    });
    frontendContainer.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // ============================================
    //  Fargate Service — Frontend
    // ============================================
    const frontendService = new ecs.FargateService(this, "HyperPushFrontendService", {
      cluster,
      taskDefinition: frontendTaskDef,
      serviceName: "hyperpush-frontend",
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      desiredCount: 1,
      enableExecuteCommand: true,
      healthCheckGracePeriod: cdk.Duration.seconds(30),
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
    });

    // ============================================
    //  ALB Target Groups
    // ============================================
    // Console: /graphql* + /api/* → app:3000, /* → frontend:80
    const consoleTargetGroup = new elbv2.ApplicationTargetGroup(this, "HyperPushConsoleTg", {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [appService],
      healthCheck: {
        path: "/graphql",
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: "200",
      },
      targetGroupName: "hyperpush-console-tg",
    });

    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(this, "HyperPushFrontendTg", {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [frontendService],
      healthCheck: {
        path: "/",
        interval: cdk.Duration.seconds(30),
        healthyHttpCodes: "200",
      },
      targetGroupName: "hyperpush-frontend-tg",
    });

    // HTTPS listener rules
    httpsListener.addAction("ConsoleRoute", {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/graphql*", "/api/*"])],
      action: elbv2.ListenerAction.forward([consoleTargetGroup]),
    });

    httpsListener.addAction("FrontendRoute", {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/*"])],
      action: elbv2.ListenerAction.forward([frontendTargetGroup]),
    });

    // ============================================
    //  CloudWatch Alarms
    // ============================================
    new cloudwatch.Alarm(this, "HyperPushCpuHigh", {
      metric: appService.metricCpuUtilization(),
      alarmName: "hyperpush-app-cpu-high",
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 1,
    });

    // ============================================
    //  Outputs
    // ============================================
    new cdk.CfnOutput(this, "AlbDnsName", {
      value: alb.loadBalancerDnsName,
      description: "ALB DNS (point console.yourdomain.com → this)",
    });

    new cdk.CfnOutput(this, "AppRepoUri", {
      value: appRepo.repositoryUri,
      description: "ECR repo URI for backend image",
    });

    new cdk.CfnOutput(this, "FrontendRepoUri", {
      value: frontendRepo.repositoryUri,
      description: "ECR repo URI for frontend image",
    });

    new cdk.CfnOutput(this, "DbEndpoint", {
      value: db.dbInstanceEndpointAddress,
      description: "RDS PostgreSQL endpoint",
    });

    new cdk.CfnOutput(this, "DbSecretArn", {
      value: db.secret?.secretArn || "",
      description: "Secrets Manager ARN for DB credentials",
    });
  }
}
