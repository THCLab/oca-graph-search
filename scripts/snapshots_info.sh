#!/bin/bash
DATA_DIR="/var/lib/cassandra/data"
KEYSPACE=$1

echo "-------------------Snapshots for $KEYSPACE:-------------------------"
SNAPSHOTS=$(find $DATA_DIR/$KEYSPACE -depth -type f -iwholename "*/snapshots/*.tar.gz" | rev | cut -d '/' -f 1 | rev | cut -d '.' -f 1 | sort -ru)

for snapshot in $SNAPSHOTS; do
  echo "$snapshot ($(date -d @$(expr $snapshot / 1000)))"
done
