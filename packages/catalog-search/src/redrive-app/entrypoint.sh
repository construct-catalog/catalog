#!/bin/sh
mkdir /tmp/app
cp index.js /tmp/app
cd /tmp/app

npm init -y
npm i aws-sdk

node index.js
