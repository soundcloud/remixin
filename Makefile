uglify := ./node_modules/.bin/uglifyjs
mocha := ./node_modules/.bin/mocha
nyc := ./node_modules/.bin/nyc

devOpts := \
	--compress sequences=false,warnings=false \
	--beautify indent-level=2,bracketize=true \
	--comments all

prodOpts := \
	--compress pure_getters=true,warnings=false,unsafe=true \
	--mangle \
	--comments "/^!/"

commonOpts := --screw-ie8

outputFiles := dist/remixin-cjs.js dist/remixin-dev-cjs.js dist/remixin-global.js dist/remixin-dev-global.js

.PHONY: all clean test coverage

all: $(outputFiles)

clean:
	rm -rf dist coverage .nyc_output

test: dist/remixin-dev-cjs.js node_modules
	$(nyc) --reporter=text --reporter=html $(mocha)

coverage: test
	open $@/index.html

node_modules: package.json
	npm install
	touch $@

dist/remixin-dev-cjs.js: src/remixin.js node_modules
	mkdir -p $(@D)
	$(uglify) src/remixin.js $(devOpts) $(commonOpts) \
		--define __EXPORT__=true,__INJECTION__=false,__DEBUG__=true \
		--output $@

dist/remixin-dev-global.js: src/remixin.js node_modules
	mkdir -p $(@D)
	$(uglify) src/remixin.js $(devOpts) $(commonOpts) \
		--define __EXPORT__=false,__INJECTION__=true,__DEBUG__=true \
		--output $@

dist/remixin-cjs.js: src/remixin.js node_modules
	mkdir -p $(@D)
	$(uglify) src/remixin.js $(prodOpts) $(commonOpts) \
		--define __EXPORT__=true,__INJECTION__=false,__DEBUG__=false \
		--output $@

dist/remixin-global.js: src/remixin.js node_modules
	mkdir -p $(@D)
	$(uglify) src/remixin.js $(prodOpts) $(commonOpts) \
		--define __EXPORT__=false,__INJECTION__=true,__DEBUG__=false \
		--output $@
