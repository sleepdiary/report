FILES = src/sleepdiary-report.js

CLOSURE_OPTIONS= \
		--generate_exports \
		--export_local_property_definitions \
		--isolation_mode=IIFE \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--language_in ECMASCRIPT_NEXT_IN \
		--language_out ECMASCRIPT5 \

sleepdiary-report.min.js: src/header.js src/constants.js $(FILES) src/footer.js
	./bin/create-constants.sh
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--js constants.js $^ \
		--create_source_map $@.map --js_output_file $@
	echo "//# sourceMappingURL="$@.map >> $@
	rm -f constants.js

build: sleepdiary-report.min.js

clean:
	rm -rf README.html sleepdiary-report.min.js*
