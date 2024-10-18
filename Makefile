WEB_DIR := ./web
FIRMWARE_DIR := ./firmware
BUILD_DIR := ./build
DOCKER_DIR := ./.docker
DOCKER_WEB_DIR := $(DOCKER_DIR)/web

WEB_DEPS_INSTALLED_FLAG := $(BUILD_DIR)/.web_deps_installed

all:

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

web-deps: $(BUILD_DIR)
	@if [ ! -f $(WEB_DEPS_INSTALLED_FLAG) ]; then \
		echo "Installing web dependencies"; \
		cd $(WEB_DIR) \
		&& npm i \
		&& cd - \
		&& touch $(WEB_DEPS_INSTALLED_FLAG); \
	fi

web: web-deps
	@echo "Building web"
	cd $(WEB_DIR) \
	&& npm run build

web-dev: web-deps
	@echo "Running web in development mode"
	cd $(WEB_DIR) \
	&& npm run dev -- --open

# args are optional and can be passed as
# `make web-docker TAG=latest REPO_TAG=1.0.0 REPO_TAG_NAME=v1.0.0`
web-docker:
	@echo "Building web docker image"
	docker build \
		-t nfcity:$(if $(TAG),$(TAG),latest) \
		-f $(DOCKER_WEB_DIR)/Dockerfile \
		$(WEB_DIR) \
		$(if $(REPO_TAG),--build-arg REPO_TAG=$(REPO_TAG)) \
		$(if $(REPO_TAG_NAME),--build-arg REPO_TAG_NAME=$(REPO_TAG_NAME))

clean:
	@echo "Cleaning"
	rm -rf $(WEB_DEPS_INSTALLED_FLAG)
	rm -rf $(WEB_DIR)/dist
	rm -rf $(WEB_DIR)/*.tsbuildinfo

.PHONY:
	web-deps
	web
	clean
