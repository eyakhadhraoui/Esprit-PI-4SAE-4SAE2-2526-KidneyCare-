#!/usr/bin/env bash
# Node binaire (plugin Jenkins NodeJS) peut exiger libatomic.so.1 sur glibc.
# Usage : depuis la racine du dépôt (workspace Jenkins), avant npm / npx.

set -e

if node -v >/dev/null 2>&1; then
  echo "[jenkins-ensure-node-libatomic] Node OK."
  exit 0
fi

if [ -f /etc/os-release ] && grep -qiE 'debian|ubuntu' /etc/os-release; then
  if dpkg -s libatomic1 >/dev/null 2>&1; then
    echo "[jenkins-ensure-node-libatomic] libatomic1 est installé mais node échoue encore."
    node -v || true
    exit 1
  fi
  if [ "$(id -u)" = "0" ]; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libatomic1
  elif command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libatomic1
  else
    echo "[jenkins-ensure-node-libatomic] Installez sur l'agent : apt-get install -y libatomic1 (root ou sudo)."
    exit 1
  fi
elif [ -f /etc/redhat-release ] || { [ -f /etc/os-release ] && grep -qiE 'rhel|centos|fedora|rocky|alma' /etc/os-release; }; then
  if [ "$(id -u)" = "0" ]; then
    (dnf install -y libatomic 2>/dev/null) || yum install -y libatomic
  elif command -v sudo >/dev/null 2>&1; then
    sudo dnf install -y libatomic 2>/dev/null || sudo yum install -y libatomic
  else
    echo "[jenkins-ensure-node-libatomic] Installez libatomic (dnf/yum) sur l'agent."
    exit 1
  fi
else
  echo "[jenkins-ensure-node-libatomic] OS non pris en charge : installez la bibliothèque libatomic pour Node."
  exit 1
fi

node -v
