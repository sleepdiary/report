FROM node:latest
RUN true \
    && npm install -g google-closure-compiler \
    && echo && echo "All packages installed!"
ENV NODE_PATH=/usr/local/lib/node_modules
WORKDIR /app
CMD ["/app/bin/compile.sh"]
