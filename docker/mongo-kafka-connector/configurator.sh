#!/bin/bash

echo "Building the MongoDB Kafka Connector"

function clean_up {
    echo -e "\n\nSHUTTING DOWN\n\n"
    curl --output /dev/null -X DELETE http://connect:8083/connectors/mongo-source || true
    if [ -z "$1" ]
    then
      echo -e "Bye!\n"
    else
      echo -e $1
    fi
}

sleep 5
echo -ne "\n\nWaiting for the systems to be ready.."
function test_systems_available {
  COUNTER=0
  until $(curl --output /dev/null --silent --head --fail http://connect:$1); do
      printf '.'
      sleep 2
      let COUNTER+=1
      if [[ $COUNTER -gt 30 ]]; then
        MSG="\nWARNING: Could not reach configured kafka system on http://connect:$1 \nNote: This script requires curl.\n"

          if [[ "$OSTYPE" == "darwin"* ]]; then
            MSG+="\nIf using OSX please try reconfiguring Docker and increasing RAM and CPU. Then restart and try again.\n\n"
          fi

        echo -e $MSG
        clean_up "$MSG"
        exit 1
      fi
  done
}

test_systems_available 8083

trap clean_up EXIT

echo -e "\nKafka Connectors:"
curl -X GET "http://connect:8083/connectors/" -w "\n"

sleep 5

echo -e "\nAdding MongoDB Kafka Source Connector for the 'test.pageviews' collection:"
curl -X POST -H "Content-Type: application/json" --data @/opt/source.config.json http://connect:8083/connectors -w "\n"

sleep 2
echo -e "\nKafka Connectors: \n"
curl -X GET "http://connect:8083/connectors/" -w "\n"

sleep infinity & PID=$!
trap "kill $PID" INT TERM
wait