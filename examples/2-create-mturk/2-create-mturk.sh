#!/bin/sh

curl -X POST -H 'Content-Type: application/json' -T mturktask.json http://localhost:3000/task
