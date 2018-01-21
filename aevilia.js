'use strict';

$.get({
	url: '/build.status',
	dataType: 'text'
	
}).done(function(data) {
	$('#build-status').text(data);

}).fail(function() {
	$('#build-status').text('Failed to retrieve build status.');
});

$.get({
	url: '/build.log',
	dataType: 'text'
	
}).done(function(data) {
	$('#build-log').text(data);

}).fail(function() {
	$('#build-log').text('Failed to retrieve build log.');
});
