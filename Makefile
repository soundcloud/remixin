babel := ./node_modules/.bin/babel
mocha := ./node_modules/.bin/mocha
nyc := ./node_modules/.bin/nyc
outputFiles := $(patsubst src/%,dist/%,$(wildcard src/*.js))

.PHONY: all clean test coverage

all: $(outputFiles)

clean:
	rm -rf dist coverage .nyc_output

test: node_modules
	$(nyc) --reporter=text --reporter=html --require=@babel/register $(mocha)

coverage: test
	open $@/index.html

node_modules: package.json
	npm install
	touch $@

dist/%.js: src/%.js node_modules
	mkdir -p $(@D)
	$(babel) $< -o $@
