targetScope = 'subscription'

@minLength(1)
@description('Primary location for all resources')
param location string

@minLength(6)
@description('Prefix used for all resources')
param prefix string

@minLength(6)
@description('Resource Group name')
param resourceGroupName string

param appServicePlanName string = '${prefix}asp'
param backendServiceName string = '${prefix}backend'
param functionAppName string = '${prefix}func'

param searchServiceName string = '${prefix}azs'
param searchServiceSkuName string = 'standard'

param storageAccountName string = '${prefix}stor'
param containerName string = 'chatpdf'

param openAiServiceName string = '${prefix}oai'

param openAiSkuName string = 'S0'

param gptDeploymentName string = 'davinci'
param gptModelName string = 'text-davinci-003'
param chatGptDeploymentName string = 'chat'
param chatGptModelName string = 'gpt-35-turbo'
param textEmbeddingDeploymentName string = 'text-embedding-ada-002'
param textEmbeddingModelName string = 'text-embedding-ada-002'

@description('Id of the user or app to assign application roles')
param principalId string = ''

var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, location))
var tags = {}

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${location}'
  location: location
  tags: tags
}

// Create an App Service Plan to group applications under the same payment plan and SKU
module appServicePlan 'core/host/appserviceplan.bicep' = {
  name: 'appserviceplan'
  scope: resourceGroup
  params: {
    name: !empty(appServicePlanName) ? appServicePlanName : '${abbrs.webServerFarms}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'B1'
      capacity: 1
    }
    kind: 'linux'
  }
}

module function 'core/host/appservice.bicep' = {
  name: 'function'
  scope: resourceGroup
  params: {
    name: !empty(functionAppName) ? functionAppName : '${abbrs.webSitesAppService}func-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'backend' })
    appServicePlanId: appServicePlan.outputs.id
    runtimeName: 'python'
    runtimeVersion: '3.10'
    scmDoBuildDuringDeployment: true
    managedIdentity: true
    appSettings: {
      OpenAiApiKey: storage.outputs.name
      OpenAiService:openAi.outputs.name
      OpenAiEndPoint:openAi.outputs.endpoint
      OpenAiVersion:'2022-12-01'
      OpenAiDavinci:gptDeploymentName
      OpenAiEmbedding:textEmbeddingDeploymentName
      MaxTokens:500
      Temperature:'0.3'
      OpenAiChatDocStorName:storage.outputs.name
      OpenAiChatDocContainer:containerName
      OpenAiChat:chatGptDeploymentName
      PineconeKey:''
      PineconeEnv:''
      VsIndexName:''
      RedisPassword:''
      RedisAddress:''
      RedisPort:''
      OpenAiDocStorName:storage.outputs.name
      //OpenAiDocStorKey:listKeys(resourceId(subscription().subscriptionId, resourceGroup.name, storage.type, storage.name), storage.apiVersion).keys[0].value
      OpenAiDocContainer:containerName
      //SearchService:searchServiceName.outputs.name
      //SearchKey:
    }
  }
}

// The application frontend
module backend 'core/host/appservice.bicep' = {
  name: 'web'
  scope: resourceGroup
  params: {
    name: !empty(backendServiceName) ? backendServiceName : '${abbrs.webSitesAppService}backend-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'backend' })
    appServicePlanId: appServicePlan.outputs.id
    runtimeName: 'python'
    runtimeVersion: '3.10'
    scmDoBuildDuringDeployment: true
    managedIdentity: true
    appSettings: {
      QA_URL: storage.outputs.name
      CHAT_URL: containerName
      CHAT3_URL: openAi.outputs.name
      DOCGENERATOR_URL: searchService.outputs.name
      SUMMARYQA_URL: gptDeploymentName
      //BLOB_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storage.outputs.name};AccountKey=${listKeys(storage.outputs.id, storage.outputs.apiVersion).keys[0].value};EndpointSuffix=core.windows.net'
      BLOB_CONTAINER_NAME:containerName
    }
  }
}

module openAi 'core/ai/cognitiveservices.bicep' = {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: !empty(openAiServiceName) ? openAiServiceName : '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: openAiSkuName
    }
    deployments: [
      {
        name: gptDeploymentName
        model: {
          format: 'OpenAI'
          name: gptModelName
          version: '1'
        }
        scaleSettings: {
          scaleType: 'Standard'
        }
      }
      {
        name: chatGptDeploymentName
        model: {
          format: 'OpenAI'
          name: chatGptModelName
          version: '0301'
        }
        scaleSettings: {
          scaleType: 'Standard'
        }
      }
      {
        name: textEmbeddingDeploymentName
        model: {
          format: 'OpenAI'
          name: textEmbeddingModelName
          version: '1'
        }
        scaleSettings: {
          scaleType: 'Standard'
        }
      }
    ]
  }
}

module searchService 'core/search/search-services.bicep' = {
  name: 'search-service'
  scope: resourceGroup
  params: {
    name: !empty(searchServiceName) ? searchServiceName : 'gptkb-${resourceToken}'
    location: location
    tags: tags
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    sku: {
      name: searchServiceSkuName
    }
    semanticSearch: 'free'
  }
}

module storage 'core/storage/storage-account.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: !empty(storageAccountName) ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
    publicNetworkAccess: 'Enabled'
    sku: {
      name: 'Standard_ZRS'
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 2
    }
    containers: [
      {
        name: 'content'
        publicAccess: 'None'
      }
    ]
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

output AZURE_OPENAI_SERVICE string = openAi.outputs.name
output AZURE_OPENAI_GPT_DEPLOYMENT string = gptDeploymentName
output AZURE_OPENAI_CHATGPT_DEPLOYMENT string = chatGptDeploymentName

output AZURE_SEARCH_SERVICE string = searchService.outputs.name

output AZURE_STORAGE_ACCOUNT string = storage.outputs.name
output AZURE_STORAGE_CONTAINER string = containerName

output BACKEND_URI string = backend.outputs.uri
