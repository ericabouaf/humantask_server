#!/bin/sh
#
# Install node dependencies for all plugins
#

npm install

cd core
for file in * ; do 
	cd $file
	npm install
	cd ..
done
