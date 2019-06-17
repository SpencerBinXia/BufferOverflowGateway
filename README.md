# BufferOverflow

A Stack Overflow clone deployed across 12 UpCloud server instances, capable of handling 200k requests by 1k concurrent users with <250ms latency for 95% of requests. Application architecture is described below.

**Node.js Instances:**

All Node.js backend instances with multiple vCPUs are running in Cluster Mode with pm2.

API Gateway Service - 2 vCPUs, 4 GB RAM. 
Questions Service - 4 vCPUs, 4 GB RAM. Contains the Mongos routing service. 
Users Service - 1 vCPU, 2 GB RAM. Contains a postfix mail server.

**MongoDB Instances:**

Users Database - 1 vCPU, 2 GB RAM.
Questions/Answers Config Server - 1 vCPU, 1 GB RAM.
Questions/Answers Database Shards 1, 2, 3 - 1 vCPU, 2GB RAM each.

**Elasticsearch Instances:**

Elasticsearch Database Shards 1, 2, 3 - 2 vCPU, 2GB RAM each.

**Cassandra Instances:**

Cassandra Database - 4 vCPUs, 8 GB RAM. Used for storing media as blobs (primarily image files). 

