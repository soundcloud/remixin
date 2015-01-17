uglify := ./node_modules/.bin/uglifyjs
mocha := ./node_modules/.bin/mocha

devOpts := \
	--compress sequences=false,warnings=false \
	--beautify indent-level=2,bracketize=true \
	--comments all

prodOpts := \
	--compress pure_getters=true,warnings=false,unsafe=true \
	--mangle \
	--comments "/^!/"

commonOpts := --screw-ie8

outputFiles := remixin-cjs.js remixin-dev-cjs.js remixin-global.js remixin-dev-global.js

.PHONY: all clean test

all: $(outputFiles)

clean:
	rm -f $(outputFiles)

test: remixin-cjs.js remixin-dev-cjs.js node_modules
	$(mocha) --require node-test-adapter.js test.js

remixin-dev-cjs.js: src/remixin.js node_modules
	$(uglify) src/remixin.js $(devOpts) $(commonOpts) \
		--define __EXPORT__=true,__INJECTION__=false,__DEBUG__=true \
		--output $@

remixin-dev-global.js: src/remixin.js node_modules
	$(uglify) src/remixin.js $(devOpts) $(commonOpts) \
		--define __EXPORT__=false,__INJECTION__=true,__DEBUG__=true \
		--output $@

remixin-cjs.js: src/remixin.js node_modules
	$(uglify) src/remixin.js $(prodOpts) $(commonOpts) \
		--define __EXPORT__=true,__INJECTION__=false,__DEBUG__=false \
		--output $@

remixin-global.js: src/remixin.js node_modules
	$(uglify) src/remixin.js $(prodOpts) $(commonOpts) \
		--define __EXPORT__=false,__INJECTION__=true,__DEBUG__=false \
		--output $@

node_modules: package.json
	npm install
	touch $@
