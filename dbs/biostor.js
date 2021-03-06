"use strict";

module.exports = {
	stringFinder: biostorSimple,
	stringParser: biostorParse,
};

var p = require('../debug')().p;
var tools = require('./tools');

function biostorSimple(text, limit) {
  p('biostorSimple ' + text, 1);
  text = text.replace(/:/g, ' ');
  text = text.replace(/\(/g, ' ');
  text = text.replace(/\)/g, ' ');
  text = text.replace(/\//g, ' ');
	return {
		protocol: 'http',
		host: 'biostor.org',
		/*
		pathname: '/api_openurl.php',
		query: {dat: text, redirect: false}
		*/
		pathname: '/api.php',
		query: {q: text}
	};
}

// search query
function biostorParse(body) {

	p('biostorParse' + body, 1);


	var refTypes = {
		'book':				'book',
		'chapter':			'book chapter',
		'article':			'journal article',
	}, references = [];

	try {
		references = JSON.parse(body).rows || [];
	} catch (e) {
		return [];
	}

	return tools.safeMap(references, function (ref) {
		var authors = tools.safeMap(ref.doc.author, function (au) {return [au.firstname, au.lastname]; }, 'Biostor::Authors');
		return {
			source:			'BioStor',
			
			authors:		authors,
			
			title:			ref.doc.title,
			year:			ref.doc.year,
			
			publishedIn:	!empty(ref.doc.journal) ? ref.doc.journal.name : undefined,
			volume:			!empty(ref.doc.journal.volume) ? ref.doc.journal.volume : undefined,
			issue:			!empty(ref.doc.journal.issue) ? ref.doc.journal.issue : undefined,
			
			spage:			!empty(ref.doc.journal.pages) ? starting_page(ref.doc.journal.pages) : undefined,
			epage:			!empty(ref.doc.journal.pages) ? ending_page(ref.doc.journal.pages) : undefined,
			
			firstauthor:	authors[0] || [],
			isParsed:		true,
			score:			ref.order[0],
			
			fullCitation:	ref.fields.default,
			type:			refTypes[(ref.doc.type || "").toLowerCase()],
			
			href:			ref.id.replace(/biostor\//, 'http://biostor.org/reference/'),
			
			doi:			get_doi(ref.doc.identifier)
		};
	}, 'BioStor::References');
}

/*
// OpenURL query with whole citation
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
			
			publishedIn:	!empty(ref.reference.journal) ? ref.reference.journal.name : undefined,
			volume:			!empty(ref.reference.journal.volume) ? ref.reference.journal.volume : undefined,
			issue:			!empty(ref.reference.journal.issue) ? ref.reference.journal.issue : undefined,
			
			spage:			!empty(ref.reference.journal.pages) ? starting_page(ref.reference.journal.pages) : undefined,
			epage:			!empty(ref.reference.journal.pages) ? ending_page(ref.reference.journal.pages) : undefined,
			
			firstauthor:	authors[0] || [],
			isParsed:		true,
			score:			ref.score,
			
			fullCitation:	ref.hit,
			type:			refTypes[(ref.reference.type || "").toLowerCase()],
			
			href:			ref.id.replace(/biostor\//, 'http://biostor.org/reference/'),
			
			doi:			get_doi(ref.reference.identifier)
		};
	}, 'BioStor::References');
}
*/

function starting_page(p) {
	var spage = undefined;
	var delimiter = p.indexOf('-');
	if (delimiter != -1) {
	  spage = p.substring(0, delimiter);
	}
	return spage;
}

function ending_page(p) {
	var epage = undefined;
	var delimiter = p.indexOf('-');
	if (delimiter != -1) {
	  epage = p.substring(delimiter+2);
	} 
	return epage;
}

function get_doi(identifier) {
	var doi = undefined;
	for (var i in identifier) {
		if (identifier[i].type == 'doi') {
			doi = identifier[i].id;
		}
	}
	return doi;
}


function empty(sth) { return typeof sth === 'undefined' || sth === "" || sth === null; }
