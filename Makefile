run: build-draft
	npx http-server -p 8080 out & sleep 3 && open http://localhost:8080

build:
	npx static-site-renderer@^2.1.0 --srcDir . --outDir out --publicUrl https://adr.decentraland.org

build-draft:
	IS_DRAFT=true \
		npx static-site-renderer@^2.1.0 --srcDir . --outDir out --publicUrl http://localhost:8080
debug:
	../static-site-renderer/dist/index.js --srcDir . --outDir out --publicUrl http://localhost:8080

.PHONY: build debug
