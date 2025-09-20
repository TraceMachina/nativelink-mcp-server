import { z } from 'zod';
import { Platform, Scale } from '../lib/types.js';

export const GenerateDeploymentConfigSchema = z.object({
  platform: Platform,
  scale: Scale,
  features: z.array(z.string()).optional()
});

export type GenerateDeploymentConfigParams = z.infer<typeof GenerateDeploymentConfigSchema>;

export function generateDeploymentConfig(params: GenerateDeploymentConfigParams): string {
  const features = params.features || [];

  switch (params.platform) {
    case 'kubernetes':
      return generateKubernetesConfig(params.scale, features);
    case 'docker':
      return generateDockerConfig(params.scale, features);
    case 'aws':
      return generateAWSConfig(params.scale, features);
    case 'gcp':
      return generateGCPConfig(params.scale, features);
    case 'azure':
      return generateAzureConfig(params.scale, features);
    default:
      return generateDockerConfig(params.scale, features);
  }
}

function generateKubernetesConfig(scale: Scale, features: string[]): string {
  const replicas = getReplicaCount(scale);
  const resources = getResourceLimits(scale);

  return `# Nativelink Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nativelink
  namespace: build-cache
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: nativelink
  template:
    metadata:
      labels:
        app: nativelink
    spec:
      containers:
      - name: nativelink
        image: ghcr.io/tracemachina/nativelink:latest
        ports:
        - containerPort: 50051
          name: grpc
        - containerPort: 50052
          name: cas
        ${features.includes('monitoring') ? `- containerPort: 9090
          name: metrics` : ''}
        resources:
          limits:
            memory: "${resources.memory}"
            cpu: "${resources.cpu}"
          requests:
            memory: "${resources.memory}"
            cpu: "${resources.cpu}"
        env:
        - name: NATIVELINK_CONFIG
          value: /config/config.json5
        volumeMounts:
        - name: config
          mountPath: /config
        ${features.includes('high_availability') ? `livenessProbe:
          grpc:
            port: 50051
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          grpc:
            port: 50051
          initialDelaySeconds: 5
          periodSeconds: 5` : ''}
      volumes:
      - name: config
        configMap:
          name: nativelink-config
---
apiVersion: v1
kind: Service
metadata:
  name: nativelink
  namespace: build-cache
spec:
  selector:
    app: nativelink
  ports:
  - port: 50051
    targetPort: 50051
    name: grpc
  - port: 50052
    targetPort: 50052
    name: cas
  ${features.includes('monitoring') ? `- port: 9090
    targetPort: 9090
    name: metrics` : ''}
  type: LoadBalancer
${features.includes('autoscaling') ? `---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nativelink-hpa
  namespace: build-cache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nativelink
  minReplicas: ${replicas}
  maxReplicas: ${replicas * 3}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80` : ''}`;
}

function generateDockerConfig(scale: Scale, features: string[]): string {
  const resources = getResourceLimits(scale);

  return `# Nativelink Docker Compose Configuration
version: '3.8'

services:
  nativelink:
    image: ghcr.io/tracemachina/nativelink:latest
    container_name: nativelink
    ports:
      - "50051:50051"  # gRPC
      - "50052:50052"  # CAS
      ${features.includes('monitoring') ? '- "9090:9090"    # Metrics' : ''}
    volumes:
      - ./config.json5:/config/config.json5:ro
      - nativelink-data:/data
    environment:
      - NATIVELINK_CONFIG=/config/config.json5
      - RUST_LOG=info
    ${features.includes('high_availability') ? `healthcheck:
      test: ["CMD", "grpc_health_probe", "-addr=:50051"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s` : ''}
    deploy:
      resources:
        limits:
          cpus: '${resources.cpu}'
          memory: ${resources.memory}
        reservations:
          cpus: '${parseInt(resources.cpu) / 2}'
          memory: ${parseInt(resources.memory) / 2}G
    restart: unless-stopped

volumes:
  nativelink-data:
    driver: local

networks:
  default:
    name: nativelink-network`;
}

function generateAWSConfig(scale: Scale, features: string[]): string {
  const instanceType = getAWSInstanceType(scale);

  return `# Nativelink AWS CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Nativelink Deployment on AWS'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC for Nativelink deployment

  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Subnets for Nativelink deployment

Resources:
  NativelinkCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: nativelink-cluster
      ${features.includes('monitoring') ? `ClusterSettings:
        - Name: containerInsights
          Value: enabled` : ''}

  NativelinkTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: nativelink
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '${getCPUUnits(scale)}'
      Memory: '${getMemoryMB(scale)}'
      ContainerDefinitions:
        - Name: nativelink
          Image: ghcr.io/tracemachina/nativelink:latest
          PortMappings:
            - ContainerPort: 50051
              Protocol: tcp
            - ContainerPort: 50052
              Protocol: tcp
            ${features.includes('monitoring') ? `- ContainerPort: 9090
              Protocol: tcp` : ''}
          Environment:
            - Name: NATIVELINK_CONFIG
              Value: /config/config.json5
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: /ecs/nativelink
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: nativelink

  NativelinkService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: nativelink-service
      Cluster: !Ref NativelinkCluster
      TaskDefinition: !Ref NativelinkTaskDefinition
      DesiredCount: ${getReplicaCount(scale)}
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets: !Ref SubnetIds
          SecurityGroups:
            - !Ref NativelinkSecurityGroup
      ${features.includes('autoscaling') ? `ServiceRegistries:
        - RegistryArn: !GetAtt NativelinkServiceDiscovery.Arn` : ''}

  NativelinkSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Nativelink
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 50051
          ToPort: 50051
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 50052
          ToPort: 50052
          CidrIp: 0.0.0.0/0
        ${features.includes('monitoring') ? `- IpProtocol: tcp
          FromPort: 9090
          ToPort: 9090
          CidrIp: 0.0.0.0/0` : ''}

Outputs:
  ClusterName:
    Value: !Ref NativelinkCluster
  ServiceName:
    Value: !GetAtt NativelinkService.Name`;
}

function generateGCPConfig(scale: Scale, features: string[]): string {
  const machineType = getGCPMachineType(scale);

  return `# Nativelink Google Cloud Deployment Manager
resources:
- name: nativelink-instance-template
  type: compute.v1.instanceTemplate
  properties:
    properties:
      machineType: ${machineType}
      disks:
      - deviceName: boot
        type: PERSISTENT
        boot: true
        autoDelete: true
        initializeParams:
          sourceImage: projects/cos-cloud/global/images/family/cos-stable
      networkInterfaces:
      - network: global/networks/default
        accessConfigs:
        - name: External NAT
          type: ONE_TO_ONE_NAT
      metadata:
        items:
        - key: user-data
          value: |
            #cloud-config
            write_files:
            - path: /etc/systemd/system/nativelink.service
              permissions: 0644
              content: |
                [Unit]
                Description=Nativelink Service
                After=docker.service
                Requires=docker.service

                [Service]
                ExecStart=/usr/bin/docker run \\
                  -p 50051:50051 \\
                  -p 50052:50052 \\
                  ${features.includes('monitoring') ? '-p 9090:9090 \\' : ''}
                  -v /opt/nativelink/config.json5:/config/config.json5 \\
                  ghcr.io/tracemachina/nativelink:latest
                Restart=always

                [Install]
                WantedBy=multi-user.target
            runcmd:
            - systemctl daemon-reload
            - systemctl enable nativelink.service
            - systemctl start nativelink.service

- name: nativelink-mig
  type: compute.v1.instanceGroupManager
  properties:
    zone: us-central1-a
    targetSize: ${getReplicaCount(scale)}
    baseInstanceName: nativelink
    instanceTemplate: $(ref.nativelink-instance-template.selfLink)
    ${features.includes('autoscaling') ? `autoHealingPolicies:
    - healthCheck: $(ref.nativelink-health-check.selfLink)
      initialDelaySec: 300` : ''}

${features.includes('monitoring') ? `- name: nativelink-health-check
  type: compute.v1.healthCheck
  properties:
    type: TCP
    tcpHealthCheck:
      port: 50051
    checkIntervalSec: 10
    timeoutSec: 5
    healthyThreshold: 2
    unhealthyThreshold: 3` : ''}`;
}

function generateAzureConfig(scale: Scale, features: string[]): string {
  const vmSize = getAzureVMSize(scale);

  return `# Nativelink Azure Resource Manager Template
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": {
        "description": "Location for all resources"
      }
    }
  },
  "variables": {
    "containerGroupName": "nativelink-container-group",
    "containerName": "nativelink"
  },
  "resources": [
    {
      "type": "Microsoft.ContainerInstance/containerGroups",
      "apiVersion": "2021-09-01",
      "name": "[variables('containerGroupName')]",
      "location": "[parameters('location')]",
      "properties": {
        "containers": [
          {
            "name": "[variables('containerName')]",
            "properties": {
              "image": "ghcr.io/tracemachina/nativelink:latest",
              "ports": [
                {
                  "port": 50051,
                  "protocol": "TCP"
                },
                {
                  "port": 50052,
                  "protocol": "TCP"
                }${features.includes('monitoring') ? `,
                {
                  "port": 9090,
                  "protocol": "TCP"
                }` : ''}
              ],
              "environmentVariables": [
                {
                  "name": "NATIVELINK_CONFIG",
                  "value": "/config/config.json5"
                }
              ],
              "resources": {
                "requests": {
                  "cpu": ${parseInt(getResourceLimits(scale).cpu)},
                  "memoryInGB": ${parseInt(getResourceLimits(scale).memory)}
                }
              }
            }
          }
        ],
        "osType": "Linux",
        "restartPolicy": "Always",
        "ipAddress": {
          "type": "Public",
          "ports": [
            {
              "port": 50051,
              "protocol": "TCP"
            },
            {
              "port": 50052,
              "protocol": "TCP"
            }${features.includes('monitoring') ? `,
            {
              "port": 9090,
              "protocol": "TCP"
            }` : ''}
          ]
        }
      }
    }
  ],
  "outputs": {
    "containerIPAddress": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.ContainerInstance/containerGroups', variables('containerGroupName'))).ipAddress.ip]"
    }
  }
}`;
}

function getReplicaCount(scale: Scale): number {
  switch (scale) {
    case 'small': return 1;
    case 'medium': return 3;
    case 'large': return 5;
    case 'enterprise': return 10;
  }
}

function getResourceLimits(scale: Scale): { cpu: string; memory: string } {
  switch (scale) {
    case 'small': return { cpu: '2', memory: '4Gi' };
    case 'medium': return { cpu: '4', memory: '8Gi' };
    case 'large': return { cpu: '8', memory: '16Gi' };
    case 'enterprise': return { cpu: '16', memory: '32Gi' };
  }
}

function getCPUUnits(scale: Scale): string {
  switch (scale) {
    case 'small': return '2048';
    case 'medium': return '4096';
    case 'large': return '8192';
    case 'enterprise': return '16384';
  }
}

function getMemoryMB(scale: Scale): string {
  switch (scale) {
    case 'small': return '4096';
    case 'medium': return '8192';
    case 'large': return '16384';
    case 'enterprise': return '32768';
  }
}

function getAWSInstanceType(scale: Scale): string {
  switch (scale) {
    case 'small': return 't3.large';
    case 'medium': return 't3.xlarge';
    case 'large': return 'm5.2xlarge';
    case 'enterprise': return 'm5.4xlarge';
  }
}

function getGCPMachineType(scale: Scale): string {
  switch (scale) {
    case 'small': return 'n2-standard-2';
    case 'medium': return 'n2-standard-4';
    case 'large': return 'n2-standard-8';
    case 'enterprise': return 'n2-standard-16';
  }
}

function getAzureVMSize(scale: Scale): string {
  switch (scale) {
    case 'small': return 'Standard_D2s_v3';
    case 'medium': return 'Standard_D4s_v3';
    case 'large': return 'Standard_D8s_v3';
    case 'enterprise': return 'Standard_D16s_v3';
  }
}