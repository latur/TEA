/* -------------------------------------------- */
"use strict";

const chrsSum = 3088269832;
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
var expID = '';
// Experiment Samples Data
var expData = {};
// Page elements
var doc = $('#content')[0];
var nav = $('#navbar')[0];
// Cache for imagedata
var cache = {'hm' : {}};

/* -------------------------------------------- */
/* ??? */
const density_len = [249, 243, 199, 191, 182, 171, 160, 146, 139, 134, 136, 134, 115, 108, 102, 91, 84, 81, 59, 65, 47, 51, 157, 58];
const chr_total = 3088269832;
const TE_type = ["Alu", "Line", "Others"];

var file_list = [], id_list = {};
var n_file = 0;
var density_map = {}, d_max = 0;
var tree = [];
var color = ["green", "red", "blue"];


/* -------------------------------------------- */
/* Functions */

// Routing based on location.hash
function Route(loc){
	if (loc) location.hash = loc + '/' + expID;
	// Show one chromosome
	var chr = location.hash.match(/^\#?(chr[0-9XY]+)\:([0-9]+)\-([0-9]+)\/?([0-9a-z]+)?$/);
	if (chr) {
		if (chr[4]) expID = chr[4];
		return ShowChromosome(chr[1], parseInt(chr[2]), parseInt(chr[3]));
	}
	// Show chromosome list
	var home = location.hash.match(/^\#?([a-z]+)?\/?([0-9a-z]+)?\/?$/);
	if (home[2]) expID = home[2];
	if (home[1] == 'line') return ShowAsLine();
	return ShowAsList();
}

// The template. Obtaining a template name and pasting data
function Template(name, data){
	var html = $('#' + name + '-template').html();
	for (var e in data){
		var find = new RegExp("{" + e + "}", "g");
		html = html.replace(find, data[e] == undefined ? '' : data[e]);
	}
	return html;
}

// Sort of retrotransposons in the order on the chromosome
function SamplesLoaded(){
	// Clear cache
	cache = {'hm' : {}};
	// Sort samples
	for (var chr in expData) {
		for (var f in expData[chr]) {
			expData[chr][f] = expData[chr][f].sort(function(a,b){
				if (a[0] > b[0]) return  1;
				if (a[0] < b[0]) return -1;
				return 0;
			});
		}
	}
	// Samples nav
	nav.innerHTML = Template('samples-nav');
	$('.samples-nav-pane .clear').click(function(){ location.href = '' });
	$('.samples-nav-pane .comparision').click(function(){ });
	$('.samples-nav-pane .showtree').click(function(){ });
	return true;
}

// Getting heatmap pictures for chromosome
function SamplesHM(chr){
	if (!expData[chr]) return ;
	var width = $('.' + chr).width() + 2; // +2 is border
	var height = Object.keys(expData[chr]).length * 10;
	
	if (!(chr in cache.hm)){
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext('2d');
		var cdt = ctx.getImageData(0, 0, width, height);	
		var Pixel = function(x,y,color,a){
			var ind = (y * width + x) * 4;
			cdt.data[ind + 0] = color[0]; // R
			cdt.data[ind + 1] = color[1]; // G
			cdt.data[ind + 2] = color[2]; // B
			cdt.data[ind + 3] = a; // A
		};
		var y = 0;
		var K = width/chrs[chr];
		var colors = [[220,0,0],[0,220,0],[0,0,220]];
		for (var f in expData[chr]) {
			expData[chr][f].map(function(sm){
				var col = colors[sm[2]-1], xx = Math.floor(K * sm[0]), yy = y + parseInt(sm[2]-1) * 3;
				Pixel(xx, yy+0, col, 255);
				Pixel(xx, yy+1, col, 255);
				Pixel(xx, yy+2, col, 255);
				Pixel(xx+1, yy+0, col, 95);
				Pixel(xx+1, yy+1, col, 95);
				Pixel(xx+1, yy+2, col, 95);
			});
			y += 10;
		}
		ctx.putImageData(cdt, 0, 0);
		cache.hm[chr] = canvas.toDataURL();
	}
	
	$('.' + chr).append(Template('hm', {
		image : cache.hm[chr],
		height : height,
		samples : Object.keys(expData[chr]).map(function(f){
			return '<div class="fn"><span>'+f.split('.').slice(0,-1).join('.')+'</span></div>';
		}).join('')
	}));
}

// Parse samples files. Separators: Col: "\t", Row: "\n"
function Parse(content, filename){
	content.split('\n').map(function(line){
		var c = line.split('\t');
		if (chrs[c[0]]) {
			if (!expData[c[0]]) expData[c[0]] = {};
			if (!expData[c[0]][filename]) expData[c[0]][filename] = [];
			c[1] = parseInt(c[1])
			expData[c[0]][filename].push(c.slice(1));
		}
	});
}

/* -------------------------------------------- */
/* Pages */

// Muse actions: select a chromosome
function _ShowHelper(){
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
	});
}
	
// Showing chromosomes in two vertical list [Igor]
function ShowAsList(){
	$('.chr-view-mode a').removeClass('disabled');
	$('.chr-view-mode .aslist').addClass('disabled');
	// Html template:
	doc.innerHTML = Template('chr-list');
	Object.keys(chrs).map(function(name, i){
		var chr = { name: name, style : '', width: chrs[name] * 100 / chrs.chr1, i: i };
		$('.side-' + i%2).append(Template('chr', chr))
	});
	_ShowHelper();
	// Heatmap of samples
	Object.keys(expData).map(SamplesHM);
}

// Showing chromosomes as one line [Thao]
function ShowAsLine(){
	$('.chr-view-mode a').removeClass('disabled');
	$('.chr-view-mode .asline').addClass('disabled');
	// Html template:
	doc.innerHTML = Template('chr-line');
	Object.keys(chrs).map(function(name, i){
		var chr = { name: name, style : 'width:' + chrs[name] * 100 / chrsSum + '%', width: 100, i: i };
		$('.chr-line').append(Template('chr', chr))
	});
	_ShowHelper();

	// This requires optimization.
	// By varying the width of the screen and re-write on a clean HPD //
	d3.select("#map").append("svg").attr("id", "g_map").attr("width", 1150);
	run_sample();
}

// Selected region on chromosome
function ShowChromosome(name, startBp, endBp){
	$('.chr-view-mode a').removeClass('disabled');
	// Html elements:
	doc.innerHTML = Template('chromosome');
	// =]
}

/* -------------------------------------------- */

function ParseData(content, name){
	if (expData.hasOwnProperty(name))
		return;

	++n_file;
	file_list.push(name);
	expData[name] = {};
	density_map[name] = {};
	content = content.split("\n");
	for (var i = 0; i < content.length; i++){
		content[i] = content[i].split(","); // separator is "\t"
		if (content[i][0].length < 1) continue;

		var chr = parseInt(content[i][0]); // parseInt ? parseInt("chr1") == NaN 
		if (!expData[name].hasOwnProperty(chr)){
			expData[name][chr] = [];
			density_map[name][chr] = [];
			for (var k = 0; k < density_len[chr]; k++)
				density_map[name][chr].push([0,0,0,0,0,0,0]);
		}

		var pos = parseInt(content[i][1]);
		var type = parseInt(content[i][2]);
		var id = name + '-' + chr + '-' + pos + '-' + type;
		id_list[id] = 0; // init all pos as different, turn 1 if it is a common pos

		if (type > 2) type = 2;

		expData[name][chr].push({
			"id": id,
			"pos": pos,
			"type": type
		});

		var cell = Math.ceil(pos/1000000)-1;
		if (cell >= density_len[chr]) cell = density_len[chr]-1;

		++density_map[name][chr][cell][type];
		var sum = density_map[name][chr][cell][0] + density_map[name][chr][cell][1] + density_map[name][chr][cell][2];
		if (sum > d_max)
			d_max = sum;
	}
}

function run_sample(){
	ParseData(sample, "sample1");
	ParseData(sample2, "sample2");
	ParseData(sample3, "sample3");
	get_common();
	contruct_tree();
	general_map(0);
}


$(function(){ 
	Route(false);
	$('#demo-samples').click(function(){ Route('#list/demo'); });
	$('.chr-view-mode .aslist').click(function(){ Route('#list'); });
	$('.chr-view-mode .asline').click(function(){ Route('#line'); });

	$('#load').bootstrapFileInput();
	$('#load').change(function(e){
		var fs = e.target.files;
		var ftotal = fs.length, itr = fs.length;
		for (var i = 0; i < fs.length; i++) { (function(f){
			var reader = new FileReader();
			reader.onload = function() {
				itr--;
				Parse(this.result, f.name);
				if (itr == 0) {
					SamplesLoaded();
					Route(false);
					// get_common();
					// contruct_tree();
					// general_map(0);
				}
			};
			reader.readAsText(f);
		})(fs[i]); }
	});
});
