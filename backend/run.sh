#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn spring-boot:run
