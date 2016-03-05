/* -------------------------------------------- */
"use strict";

const chrs = {
	'chr1': 248956422,  'chr2':  242193529, 'chr3': 198295559, 
	'chr4': 190214555,  'chr5':  181538259, 'chr6': 170805979, 
	'chr7': 159345973,  'chr8':  145138636, 'chr9': 138394717, 
	'chr10': 133797422, 'chr11': 135086622, 'chr12': 133275309, 
	'chr13': 114364328, 'chr14': 107043718, 'chr15': 101991189, 
	'chr16': 90338345,  'chr17': 83257441,  'chr18': 80373285, 
	'chr19': 58617616,  'chr20': 64444167,  'chr21': 46709983, 
	'chr22': 50818468,  'chrX':  156040895, 'chrY': 57227415
};

// Experiment ID 
// (if specified, need to load samples of this experiment)
var expID = false;
// Experiment Samples Data
var expData = {};
// Page element
var doc = $('#content')[0];

/* -------------------------------------------- */
Object.prototype.map = function(Exe){
	var t = this; 
	return Object.keys(t).map(function(name, index){
		return Exe(name, t[name], index);
	});
};

/* -------------------------------------------- */
function Route(loc){
	if (loc) location.hash = loc;
	// Show one chromosome
	var chr = location.hash.match(/^\#?(chr[0-9XY]+)\:([0-9]+)\-([0-9]+)\/?([0-9a-z]+)?$/);
	if (chr) {
		if (chr[4]) expID = chr[4];
		return ShowChromosome(chr[1], parseInt(chr[2]), parseInt(chr[3]));
	}
	// Show chromosome list
	var home = location.hash.match(/^\#?\/?([0-9a-z]+)?$/);
	if (home[1]) expID = home[1];
	return ShowList();
}

function Template(name, data){
	var html = $('#' + name + '-template').html();
	for (var e in data){
		var find = new RegExp("{" + e + "}", "g");
		html = html.replace(find, data[e] == undefined ? '' : data[e]);
	}
	return html;
}

function ShowList(){
	// Html elements:
	doc.innerHTML = Template('chrlist');
	chrs.map(function(name, size, i){
		var chr = { name: name, width: size * 100 / chrs.chr1, i: i };
		$('.side-' + i%2).append(Template('chr', chr))
	});
	// Actions: select chromosome
	var offset = 40000;
	$('.chr-box').each(function(){
		var e = $(this)[0], name = $(this).data('name');
		var K = chrs[name]/$(this).width();
		$(this).mousemove(function(h){
			e.children[0].style.left = h.offsetX + 'px';
			var pt = parseInt(h.offsetX * K);
			var start = pt - offset < 0 ? 0 : pt - offset;
			var stop  = pt + offset > chrs[name] ? chrs[name] : pt + offset;
			e.children[0].innerHTML = name + ':' + start + '-' + stop;
		}).click(function(){
			var loc = $(this).children('.helper').html();
			Route(loc);
		});
	})
}

function ShowChromosome(name, startBp, endBp){
	doc.innerHTML = name + ', ' + startBp + ': ' + endBp;
}

$(function(){ Route(false); });
