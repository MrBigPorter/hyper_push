import { gql } from '@apollo/client';

// ─── Auth ───────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;

export const ME_QUERY = gql`
  query me {
    me {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;

// ─── Servers ────────────────────────────────────────────

export const GET_SERVERS = gql`
  query getServers {
    getServers {
      id
      name
      username
      apiKey
      isOnline
      userId
      createdAt
      updatedAt
    }
  }
`;

export const GET_SERVER = gql`
  query server($id: String!) {
    server(id: $id) {
      id
      name
      username
      apiKey
      isOnline
      userId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SERVER = gql`
  mutation createServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
      name
      username
      apiKey
      isOnline
      userId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SERVER = gql`
  mutation updateServer($input: UpdateServerInput!) {
    updateServer(input: $input) {
      id
      name
      username
      apiKey
      isOnline
      userId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SERVER = gql`
  mutation deleteServer($id: String!) {
    deleteServer(id: $id)
  }
`;

// ─── API Keys ───────────────────────────────────────────

export const GET_API_KEYS = gql`
  query getApiKeys {
    getApiKeys {
      id
      name
      key
      active
      userId
      createdAt
      expiresAt
      lastUsed
    }
  }
`;

export const CREATE_API_KEY = gql`
  mutation createApiKey($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      id
      name
      key
      active
      userId
      createdAt
      expiresAt
      lastUsed
    }
  }
`;

export const DELETE_API_KEY = gql`
  mutation deleteApiKey($id: String!) {
    deleteApiKey(id: $id)
  }
`;

// ─── Audit Logs ─────────────────────────────────────────

export const GET_AUDIT_LOGS = gql`
  query getAuditLogs($filter: AuditLogFilterInput) {
    getAuditLogs(filter: $filter) {
      items {
        id
        action
        entity
        entityId
        detail
        userId
        ip
        createdAt
      }
      pagination {
        total
        page
        pageSize
        totalPages
      }
    }
  }
`;

// ─── CodePush ────────────────────────────────────────────

export const CODEPUSH_LOGIN = gql`
  mutation codepushLogin($serverId: String!, $account: String!, $password: String!) {
    codepushLogin(serverId: $serverId, account: $account, password: $password)
  }
`;

export const CODEPUSH_LOGOUT = gql`
  mutation codepushLogout($serverId: String!) {
    codepushLogout(serverId: $serverId)
  }
`;

export const CODEPUSH_ACCOUNT = gql`
  query codepushAccount($serverId: String!) {
    codepushAccount(serverId: $serverId)
  }
`;

export const CODEPUSH_APPS = gql`
  query codepushApps($serverId: String!) {
    codepushApps(serverId: $serverId)
  }
`;

export const CREATE_CODEPUSH_APP = gql`
  mutation createCodepushApp($input: CreateAppInput!) {
    createCodepushApp(input: $input)
  }
`;

export const UPDATE_CODEPUSH_APP = gql`
  mutation updateCodepushApp($input: UpdateAppInput!) {
    updateCodepushApp(input: $input)
  }
`;

export const DELETE_CODEPUSH_APP = gql`
  mutation deleteCodepushApp($serverId: String!, $appName: String!) {
    deleteCodepushApp(serverId: $serverId, appName: $appName)
  }
`;

export const CODEPUSH_DEPLOYMENTS = gql`
  query codepushDeployments($serverId: String!, $appName: String!) {
    codepushDeployments(serverId: $serverId, appName: $appName)
  }
`;

export const CREATE_CODEPUSH_DEPLOYMENT = gql`
  mutation createCodepushDeployment($input: CreateDeploymentInput!) {
    createCodepushDeployment(input: $input)
  }
`;

export const DELETE_CODEPUSH_DEPLOYMENT = gql`
  mutation deleteCodepushDeployment($serverId: String!, $appName: String!, $deploymentName: String!) {
    deleteCodepushDeployment(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
  }
`;

export const CODEPUSH_RELEASE_HISTORY = gql`
  query codepushReleaseHistory($serverId: String!, $appName: String!, $deploymentName: String!) {
    codepushReleaseHistory(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
  }
`;

export const PROMOTE_CODEPUSH_RELEASE = gql`
  mutation promoteCodepushRelease($input: PromoteReleaseInput!) {
    promoteCodepushRelease(input: $input)
  }
`;

export const ROLLBACK_CODEPUSH_RELEASE = gql`
  mutation rollbackCodepushRelease($serverId: String!, $appName: String!, $deploymentName: String!, $label: String) {
    rollbackCodepushRelease(serverId: $serverId, appName: $appName, deploymentName: $deploymentName, label: $label)
  }
`;

export const CODEPUSH_DEPLOYMENT_METRICS = gql`
  query codepushDeploymentMetrics($serverId: String!, $appName: String!, $deploymentName: String!) {
    codepushDeploymentMetrics(serverId: $serverId, appName: $appName, deploymentName: $deploymentName)
  }
`;

export const CODEPUSH_ACCESS_KEYS = gql`
  query codepushAccessKeys($serverId: String!) {
    codepushAccessKeys(serverId: $serverId)
  }
`;

export const CREATE_CODEPUSH_ACCESS_KEY = gql`
  mutation createCodepushAccessKey($input: CreateAccessKeyInput!) {
    createCodepushAccessKey(input: $input)
  }
`;

export const DELETE_CODEPUSH_ACCESS_KEY = gql`
  mutation deleteCodepushAccessKey($serverId: String!, $name: String!) {
    deleteCodepushAccessKey(serverId: $serverId, name: $name)
  }
`;
