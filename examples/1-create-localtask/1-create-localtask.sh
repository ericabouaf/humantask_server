#!/bin/sh

curl -X POST -H 'Content-Type: application/json' -T localtask.json http://192.168.0.41:3000/task
