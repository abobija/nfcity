FROM node:20 AS build
WORKDIR /app
COPY . .
ARG REPO_TAG=
ARG REPO_TAG_NAME=
RUN [ -n "${REPO_TAG}" ] && export VITE_APP_REPO_TAG="${REPO_TAG}" || true \
    && [ -n "${REPO_TAG_NAME}" ] && export VITE_APP_REPO_TAG_NAME="${REPO_TAG_NAME}" || true \
    && true \
    && npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
