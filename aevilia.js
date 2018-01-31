'use strict';

$.get({
	url: 'build.json',
	dataType: 'json'
	
}).done(function(data) {
	$('#build-status').text("Build status: " + data.status);

}).fail(function() {
	$('#build-status').text('Failed to retrieve build status.');
});

$.get({
	url: 'build.log',
	dataType: 'text'
	
}).done(function(data) {
	$('#build-log').text(data);

}).fail(function() {
	$('#build-log').text('Failed to retrieve build log.');
});

$('#nightly-link').click(function() {
	var today = new Date(),
		today_ISO = [today.getFullYear(), today.getMonth() + 1 /* Months start at 0 */, today.getDate()].map(x => (x + '').padStart(2, "0"));
	this.download = 'aevilia_nightly_' + today_ISO.join('-') + '.gbc';
});

