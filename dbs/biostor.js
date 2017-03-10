"use strict";

module.exports = {
	stringFinder: biostorSimple,
	stringParser: biostorParse,
};

var p = require('../debug')().p;
var tools = require('./tools');

function biostorSimple(text, limit) {
  p('biostorSimple ' + text, 1);
	return {
		protocol: 'http',
		host: 'biostor.org',
		pathname: '/api_openurl.php',
		query: {dat: text, redirect: false}
	};
}

function biostorParse(body) {

	p('biostorParse' + body, 1);


	var refTypes = {
		'book':				'book',
		'chapter':			'book chapter',
		'article':			'journal article',
	}, references = [];

	try {
		references = JSON.parse(body).results || [];
	} catch (e) {
		return [];
	}

	return tools.safeMap(references, function (ref) {
		var authors = tools.safeMap(ref.reference.author, function (au) {return [au.firstname, au.lastname]; }, 'Biostor::Authors');
		return {
			source:			'BioStor',
			
			authors:		authors,
			
			title:			ref.reference.title,
			year:			ref.reference.year,
			
			publishedIn:		!empty(ref.reference.journal) ? ref.reference.journal.name : undefined,
			volume:				!empty(ref.reference.journal.volume) ? ref.reference.journal.volume : undefined,
			issue:				!empty(ref.reference.journal.issue) ? ref.reference.journal.issue : undefined,

			//volume:			ref.volume,
			//issue:			ref.number,
			
			//firstauthor:	authors[0] || [],
			isParsed:		true,
			score:			ref.score,
			
			fullCitation:	ref.hit,
			type:			refTypes[(ref.reference.type || "").toLowerCase()]
		};
	}, 'BioStor::References');
}

function empty(sth) { return typeof sth === 'undefined' || sth === "" || sth === null; }