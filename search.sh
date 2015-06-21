#!/bin/sh

curl -XPOST "http://localhost:9200/hdo-transcripts/_search?pretty=1" -d'
{
  "size": 30000,
  "query": { 
    "query_string": {
      "query": "FrP",
      "fields": ["party"]
    }
  }
}'

