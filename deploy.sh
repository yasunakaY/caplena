#!/bin/bash

echo "On branch ${BRANCH_NAME}"

if [ "$BRANCH_NAME" == "master" ]; then
  BPATH='caplena.com'
elif [ "$BRANCH_NAME" == "develop" ]; then
  BPATH='dev.codit.co'
else
  echo "Unknown branch"
fi

if [ "$BPATH" != "" ]; then
  DETAILPATH="${BUILD_ID}_${GIT_COMMIT}"
  BPATH="gs://caplena-web-static/${BPATH}"
  echo "Copying to ${BPATH}/$DETAILPATH"
  gsutil -m rsync -d -r ./dist/ $BPATH/$DETAILPATH
  echo "Copying to ${BPATH}/current"
  gsutil -m rsync -d -r ./dist/ $BPATH/current
else
  echo 'Deployment target not set.'
fi
