import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import type {
  CreateAccessKeyInput,
  CreateAppInput,
  CreateDeploymentInput,
  PromoteReleaseInput,
  UpdateAppInput,
  UpdateDeploymentInput,
  UpdateReleaseInput,
} from '@/codepush/dto';
import type { CodepushService } from './codepush.service.js';

@Resolver()
export class CodepushResolver {
  constructor(private readonly codepushService: CodepushService) {}

  // ── Auth ───────────────────────────────────────────────────────────────

  @Mutation(() => GraphQLJSON)
  async codepushLogin(
    @Args('serverId') serverId: string,
    @Args('account') account: string,
    @Args('password') password: string,
  ) {
    return this.codepushService.login(serverId, account, password);
  }

  @Mutation(() => GraphQLJSON)
  async codepushLogout(@Args('serverId') serverId: string) {
    return this.codepushService.logout(serverId);
  }

  // ── Account ────────────────────────────────────────────────────────────

  @Query(() => GraphQLJSON)
  async codepushAccount(@Args('serverId') serverId: string) {
    return this.codepushService.getAccount(serverId);
  }

  // ── Access Keys ────────────────────────────────────────────────────────

  @Query(() => [GraphQLJSON])
  async codepushAccessKeys(@Args('serverId') serverId: string) {
    return this.codepushService.listAccessKeys(serverId);
  }

  @Mutation(() => GraphQLJSON)
  async createCodepushAccessKey(@Args('input') input: CreateAccessKeyInput) {
    return this.codepushService.createAccessKey(
      input.serverId,
      input.friendlyName,
      input.createdBy,
      input.ttl,
      input.description,
    );
  }

  @Mutation(() => Boolean)
  async deleteCodepushAccessKey(@Args('serverId') serverId: string, @Args('name') name: string) {
    await this.codepushService.deleteAccessKey(serverId, name);
    return true;
  }

  // ── Apps ───────────────────────────────────────────────────────────────

  @Query(() => [GraphQLJSON])
  async codepushApps(@Args('serverId') serverId: string) {
    return this.codepushService.listApps(serverId);
  }

  @Mutation(() => GraphQLJSON)
  async createCodepushApp(@Args('input') input: CreateAppInput) {
    return this.codepushService.createApp(input.serverId, input.name, input.os, input.platform);
  }

  @Mutation(() => GraphQLJSON)
  async updateCodepushApp(@Args('input') input: UpdateAppInput) {
    return this.codepushService.updateApp(input.serverId, input.appName, input.newName);
  }

  @Mutation(() => Boolean)
  async deleteCodepushApp(@Args('serverId') serverId: string, @Args('appName') appName: string) {
    await this.codepushService.deleteApp(serverId, appName);
    return true;
  }

  @Mutation(() => GraphQLJSON)
  async transferCodepushApp(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('email') email: string,
  ) {
    return this.codepushService.transferApp(serverId, appName, email);
  }

  // ── Collaborators ──────────────────────────────────────────────────────

  @Query(() => GraphQLJSON)
  async codepushCollaborators(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
  ) {
    return this.codepushService.listCollaborators(serverId, appName);
  }

  @Mutation(() => GraphQLJSON)
  async addCodepushCollaborator(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('email') email: string,
  ) {
    return this.codepushService.addCollaborator(serverId, appName, email);
  }

  @Mutation(() => Boolean)
  async removeCodepushCollaborator(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('email') email: string,
  ) {
    await this.codepushService.removeCollaborator(serverId, appName, email);
    return true;
  }

  // ── Deployments ────────────────────────────────────────────────────────

  @Query(() => [GraphQLJSON])
  async codepushDeployments(@Args('serverId') serverId: string, @Args('appName') appName: string) {
    return this.codepushService.listDeployments(serverId, appName);
  }

  @Query(() => GraphQLJSON)
  async codepushDeployment(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
  ) {
    return this.codepushService.getDeployment(serverId, appName, deploymentName);
  }

  @Mutation(() => GraphQLJSON)
  async createCodepushDeployment(@Args('input') input: CreateDeploymentInput) {
    return this.codepushService.createDeployment(input.serverId, input.appName, input.name);
  }

  @Mutation(() => GraphQLJSON)
  async updateCodepushDeployment(@Args('input') input: UpdateDeploymentInput) {
    return this.codepushService.updateDeployment(
      input.serverId,
      input.appName,
      input.deploymentName,
      input.newName,
    );
  }

  @Mutation(() => Boolean)
  async deleteCodepushDeployment(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
  ) {
    await this.codepushService.deleteDeployment(serverId, appName, deploymentName);
    return true;
  }

  // ── Releases ───────────────────────────────────────────────────────────

  @Query(() => [GraphQLJSON])
  async codepushReleaseHistory(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
  ) {
    return this.codepushService.releaseHistory(serverId, appName, deploymentName);
  }

  @Mutation(() => GraphQLJSON)
  async updateCodepushRelease(@Args('input') input: UpdateReleaseInput) {
    return this.codepushService.updateRelease(
      input.serverId,
      input.appName,
      input.deploymentName,
      input.label,
      Object.fromEntries(
        Object.entries({
          isDisabled: input.isDisabled,
          isMandatory: input.isMandatory,
          rollout: input.rollout,
          appVersion: input.appVersion,
          description: input.description,
        }).filter(([_, v]) => v !== undefined),
      ),
    );
  }

  @Mutation(() => GraphQLJSON)
  async promoteCodepushRelease(@Args('input') input: PromoteReleaseInput) {
    return this.codepushService.promoteRelease(
      input.serverId,
      input.appName,
      input.sourceDeploymentName,
      input.destDeploymentName,
      Object.fromEntries(
        Object.entries({
          appVersion: input.appVersion,
          description: input.description,
          isMandatory: input.isMandatory,
          rollout: input.rollout,
        }).filter(([_, v]) => v !== undefined),
      ),
    );
  }

  @Mutation(() => GraphQLJSON)
  async rollbackCodepushRelease(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
    @Args('label', { nullable: true }) label?: string,
  ) {
    if (label) {
      return this.codepushService.rollbackToLabel(serverId, appName, deploymentName, label);
    }
    return this.codepushService.rollbackRelease(serverId, appName, deploymentName);
  }

  // ── History ────────────────────────────────────────────────────────────

  @Mutation(() => Boolean)
  async clearCodepushDeploymentHistory(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
  ) {
    await this.codepushService.clearHistory(serverId, appName, deploymentName);
    return true;
  }

  // ── Metrics ────────────────────────────────────────────────────────────

  @Query(() => GraphQLJSON)
  async codepushDeploymentMetrics(
    @Args('serverId') serverId: string,
    @Args('appName') appName: string,
    @Args('deploymentName') deploymentName: string,
  ) {
    return this.codepushService.deploymentMetrics(serverId, appName, deploymentName);
  }
}
