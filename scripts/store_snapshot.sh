#!/bin/bash
DATA_DIR="/var/lib/cassandra/data"
KEYSPACE=$1

echo "-------------------Storing: $KEYSPACE-------------------------"
nodetool cleanup
SNAPSHOT=$(echo $(nodetool snapshot $KEYSPACE) | rev | cut -d ' ' -f 1 | rev)

TABLE_LIST=`bash -c "ls $DATA_DIR/$KEYSPACE"`
for table in $TABLE_LIST; do
    if [ ! -d "$DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT" ]; then
        echo SKIP "$DATA_DIR/$KEYSPACE/$table/snapshots/$SNAPSHOT";
    else
        cd $DATA_DIR/$KEYSPACE/$table/snapshots
        tar -zcvf $SNAPSHOT.tar.gz $SNAPSHOT/
    fi
done
cd /
echo "Stored: $KEYSPACE ($SNAPSHOT)----------------"
