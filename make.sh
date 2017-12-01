#!/bin/bash

NAME=`basename "$PWD"`.package

cd source
tpm create "$NAME"
mv "$NAME" ../maker.package

cd ..
cp maker.package ../widgets/maker.package

cd ../widgets
bash maker.sh