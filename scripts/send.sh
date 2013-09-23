#!/bin/sh

# Create a new activity using curl
curl -X POST -H 'Content-Type: application/json'  -T activity.json http://localhost:3000/activity

# TODO: add a basic auth: -u user:pass

