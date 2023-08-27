#!/bin/sh

curl -X POST http://localhost:11434/api/generate -d '{
  "model": "wakuchat",
  "prompt": "hello, what is your name?"
}'
