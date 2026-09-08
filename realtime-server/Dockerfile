FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY server.mjs ./
ENV NODE_ENV=production
EXPOSE 8787
USER node
CMD ["npm","start"]
