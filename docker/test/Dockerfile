FROM node:20

RUN ssh-keygen -t rsa -C bipbip@baptiste-donaux.fr -f /root/.ssh/id_rsa

RUN apt-get update \
	&& apt-get install -y \
		openssh-server \
		php8.2-cli \
		php8.2-curl \
		rsync \
		sudo \
	&& useradd --create-home test \
	&& echo "AllowUsers test" | tee /etc/ssh/sshd_config \
	&& sudo -u test mkdir ~test/.ssh \
	&& cat /root/.ssh/id_rsa.pub | tee ~test/.ssh/authorized_keys

COPY entrypoint.sh /

WORKDIR /data

ENTRYPOINT ["bash", "/entrypoint.sh"]

CMD ["npm", "test"]