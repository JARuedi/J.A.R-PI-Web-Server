FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    nodejs npm \
    mariadb-server \
    python3 python3-pip \
    nginx \
    && pip3 install mysql-connector-python pandas odfpy --break-system-packages \
    && apt-get clean

WORKDIR /app
COPY . .
RUN npm install

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000
CMD ["/start.sh"]
