# BufferOverflow

A Stack Overflow clone deployed across 12 UpCloud server instances, capable of handling 200k requests by 1k concurrent users with strict QoS requirements. Application architecture is described below.

**Node.js Instances:**

All Node.js backend instances with multiple vCPUs are running in pm2 Cluster Mode.

API Gateway Service - 2 vCPUs, 4GB RAM. Contains a MongoDB database for session storage. <br/>
Questions Service Instances 1, 2 - 2 vCPUs, 4GB RAM each. Instance 1 contains a least connections load balancer. Instance 2 contains the Mongos routing service. <br/>
Users Service - 1 vCPU, 2GB RAM. Contains a postfix mail server.

**MongoDB Instances:**

Users Database - 1 vCPU, 2GB RAM. <br/>
Questions/Answers Config Server - 1 vCPU, 1GB RAM. <br/>
Questions/Answers Database Shards 1, 2, 3 - 1 vCPU, 2GB RAM each.

**Elasticsearch Instances:**

Elasticsearch Database Shards 1, 2 - 2 vCPU, 4GB RAM each.

**Cassandra Instances:**

Cassandra Database - 4 vCPUs, 4GB RAM. Used for storing media as blobs (primarily image files). 


