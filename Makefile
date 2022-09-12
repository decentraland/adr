run: build
	npx http-server out

build:
	npx static-site-renderer --srcDir . --outDir out --publicUrl https://rfc.decentraland.org

build-draft:
	IS_DRAFT=true \
		npx static-site-renderer --srcDir . --outDir out --publicUrl http://localhost:8080

debug:
	../static-site-renderer/dist/index.js --srcDir . --outDir out --publicUrl http://localhost:8080

.PHONY: build debug