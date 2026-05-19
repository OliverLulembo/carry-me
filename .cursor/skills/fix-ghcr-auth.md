# Skill: fix-ghcr-auth

## Problem

CI/CD pipeline fails with:

error from registry: unauthorized

when pulling images from GitHub Container Registry.

## Cause

The workflow attempts to pull images from `ghcr.io` without authenticating.

## Solution

Add a login step before any Docker pull or compose commands.

Example:

```yaml
- name: Login to GHCR
  run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

## Where to Apply

Before any of these commands:

* docker pull
* docker compose
* docker buildx
* docker push

## Validation

The pipeline should successfully authenticate and pull the container image.
