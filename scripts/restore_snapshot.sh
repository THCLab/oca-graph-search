#!/bin/bash
DATA_DIR="/var/lib/cassandra/data"
KEYSPACE=$1
SNAPSHOT=$2

if [ "$KEYSPACE" = "system" ]; then
    echo ------------------SYSTEM KEYSPACE $KEYSPACE: SKIPPING---------------------------
    continue
fi
if [ "$KEYSPACE" = "system_traces" ]; then
    echo ------------------SYSTEM KEYSPACE $KEYSPACE: SKIPPING---------------------------
    continue
fi
echo "-------------------Restoring: $KEYSPACE-------------------------"
echo "Tables to restore:"
TABLE_LIST=`bash -c "ls $DATA_DIR/$KEYSPACE"`
echo $TABLE_LIST
for table in $TABLE_LIST; do
    if [ ! -f "$DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT.tar.gz" ]; then
        echo SKIP "$DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT";
    else
        tar -xzvf $DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT.tar.gz -C $DATA_DIR/$KEYSPACE/$table/snapshots/
        ls $DATA_DIR/$KEYSPACE/$table/snapshots
        t=${table%-*}
        cqlsh -e "TRUNCATE $KEYSPACE.$t"
        echo START COPY $DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT
        cp -a "$DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT/." "$DATA_DIR/$KEYSPACE/$table/"
        echo COPIED TO $DATA_DIR/$KEYSPACE/$table
        chown -R cassandra $DATA_DIR/$KEYSPACE/$table
        nodetool refresh -- $KEYSPACE $t
        echo NODE TOOL SUCCESS
        rm -rf $DATA_DIR/$KEYSPACE/$table/snapshots/truncated-*
        rm -rf $DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT
    fi
done
echo "Resotred: $KEYSPACE----------------"
