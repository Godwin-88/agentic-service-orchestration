FROM nginx:1.25-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates (self-signed for development)
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate for development (optional, can be replaced with Let's Encrypt)
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/private.key \
      -out /etc/nginx/ssl/certificate.crt \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" || true

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
