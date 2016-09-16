#!/bin/bash

passwd test <<< "$(echo -en 'test\ntest\n')"

mkdir -p /var/run/sshd
/usr/sbin/sshd -f /etc/ssh/sshd_config -D &

sleep 1

ssh test@localhost -o StrictHostKeyChecking=no 'echo "Connexion SSH enabled"'

exec "$@"
