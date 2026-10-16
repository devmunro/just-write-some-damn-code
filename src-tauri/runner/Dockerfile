FROM python:3.13.2-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    npm_config_update_notifier=false

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm php-cli tar \
    && npm install --global --prefix /opt/node-global typescript@5.7.3 \
    && rm -rf /var/lib/apt/lists/* /root/.npm

COPY runner.py /opt/jwsdc/runner.py
COPY runner.mjs /opt/jwsdc/runner.mjs
COPY runner.php /opt/jwsdc/runner.php

WORKDIR /workspace
LABEL org.opencontainers.image.title="Just Write Some Damn Code runner" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.description="Disposable local code runner for Python, JavaScript, TypeScript, and PHP"
