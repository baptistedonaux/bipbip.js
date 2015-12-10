#!/bin/sh

<%
for (var i = 0; i < steps.length; i++) {
	var step = steps[i];

	if (step.type == "mkdir") {
%>[ -d <%= step.path %> ] || mkdir -p <%= step.path %>
<%
	} else if (step.type == "touch") {
%>[ -e <%= step.path %> ] || touch <%= step.path %>
<%
	} else if (step.type == "ln") {
%>[ -L <%= step.to %> ] || ln -s <%= step.from %> <%= step.to %>
<%
	}
}
%>