#!/bin/bash
set -x

for file in data/repo-data-R33/*
do
  echo `basename $file`
  gerrit_stats.sh --exclude "" -f $file -o output_stats_R33/`basename -s .json $file`
done


