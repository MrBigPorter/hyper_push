import { Resolver, Query } from '@nestjs/graphql';

/**
 * Temporary placeholder resolver so GraphQL schema can build.
 * Replace with real resolvers (ServersResolver, AuthResolver, etc.)
 * by following the tutorial at plans/codepush-graphql-tutorial.md
 */
@Resolver()
export class AppResolver {
  @Query(() => String)
  _health(): string {
    return 'ok';
  }
}
