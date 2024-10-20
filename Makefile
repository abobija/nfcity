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

clean:
	@echo "Cleaning"
	rm -rf $(WEB_DEPS_INSTALLED_FLAG)
	rm -rf $(WEB_DIR)/dist
	rm -rf $(WEB_DIR)/*.tsbuildinfo

.PHONY:
	web-deps
	web
	clean
