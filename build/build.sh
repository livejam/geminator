#!/bin/bash -x

set -e

rm -rf layer && mkdir -p layer/bin && mkdir -p layer/ruby/gems
docker build -t ruby25-bundler-builder -f Dockerfile .

CONTAINER=$(docker run -d ruby25-bundler-builder false)

docker cp \
    $CONTAINER:/var/runtime/bin/bundle \
    layer/bin/bundle

docker cp \
    $CONTAINER:/var/runtime/bin/bundler \
    layer/bin/bundler

docker cp \
    $CONTAINER:/var/runtime/gems/bundler-2.0.1 \
    layer/ruby/gems/bundler-2.0.1

cp -r layer/* ../resources/layer
