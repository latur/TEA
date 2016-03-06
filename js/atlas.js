/* -------------------------------------------- */
"use strict";

const chrs = {
	'chr1': 249000000,  'chr2':  243000000, 'chr3': 199000000, 
	'chr4': 191000000,  'chr5':  182000000, 'chr6': 171000000, 
	'chr7': 160000000,  'chr8':  146000000, 'chr9': 139000000, 
	'chr10': 134000000, 'chr11': 136000000, 'chr12': 134000000, 
	'chr13': 115000000, 'chr14': 108000000, 'chr15': 102000000, 
	'chr16': 91000000,  'chr17': 84000000,  'chr18': 81000000, 
	'chr19': 59000000,  'chr20': 65000000,  'chr21': 47000000, 
	'chr22': 51000000,  'chrX':  157000000, 'chrY': 58000000
};
const density_len = [249, 243, 199, 191, 182, 171, 160, 146, 139, 134, 136, 134, 115, 108, 102, 91, 84, 81, 59, 65, 47, 51, 157, 58];
const chr_total = 3088269832;
const TE_type = ["Alu", "Line", "Other"];

// Experiment ID 
// (if specified, need to load samples of this experiment)
var expID = false;
// Experiment Samples Data
var expData = {};
var file_list = [];
var n_file = 0;
var density_map = {}, d_max = 0;
var color = ["green", "red", "blue"];
// Page element
<<<<<<< HEAD
var doc = $('#top_bar')[0];

/* -------------------------------------------- */
Object.prototype.map = function(Exe){
	var t = this; 
	return Object.keys(t).map(function(name, index){
		return Exe(name, t[name], index);
	});
};

/* -------------Main page--------------- */
=======
var doc = $('#content')[0];
// Cache for imagedata
var cache = {'hm' : {}};

/* -------------------------------------------- */
// Routing based on location.hash
>>>>>>> 07735be23618112eb30a69177e1bd82f59be8626
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
function DataSort(){
	cache = {'hm' : {}};
	for (var chr in expData) {
		for (var f in expData[chr]) {
			expData[chr][f] = expData[chr][f].sort(function(a,b){
				if (a[0] > b[0]) return  1;
				if (a[0] < b[0]) return -1;
				return 0;
			});
		}
	}
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



function ShowList(){
	// Html elements:
	doc.innerHTML = Template('chrlist');
<<<<<<< HEAD
	chrs.map(function(name, size, i){
		var chr = { name: name, width: size * 1050 / chr_total, i: i };
		$('#chr_list').append(Template('chr', chr))
	});

=======
	Object.keys(chrs).map(function(name, i){
		var chr = { name: name, width: chrs[name] * 100 / chrs.chr1, i: i };
		$('.side-' + i%2).append(Template('chr', chr))
	});
	$('#toList').addClass('disabled');
>>>>>>> 07735be23618112eb30a69177e1bd82f59be8626
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
	});
	// heatmap
	Object.keys(expData).map(SamplesHM);
	
}

function ShowChromosome(name, startBp, endBp){
	// Html elements:
	doc.innerHTML = Template('chromosome');
	$('#toList').removeClass('disabled');
	// doc.innerHTML = name + ', ' + startBp + ': ' + endBp;
}

<<<<<<< HEAD
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
		content[i] = content[i].split(",");
		if (content[i].length < 3) continue;

		var chr = parseInt(content[i][0]);
		if (!expData[name].hasOwnProperty(chr)){
			expData[name][chr] = [];
			density_map[name][chr] = [];
			for (var k = 0; k < density_len[chr]; k++)
				density_map[name][chr].push([0,0,0]);
		}

		var pos = parseInt(content[i][1]);
		var type = parseInt(content[i][2]);
		if (type > 2) type = 2;

		expData[name][chr].push({
			"pos": pos,
			"type": TE_type[type]
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
	general_map();
	n_file = 0;
	expData = {};
	file_list = [];
	n_file = 0;
	density_map = {};
	d_max = 0;
}

$(function(){ 
	ShowList();
	d3.select("#map").append("svg").attr("id", "g_map").attr("width", 1150);
	run_sample();

	$('#load').bootstrapFileInput();
	$('#load').change(function(e){
		$("body").css("cursor", "progress");
		var fs = e.target.files;
		var itr = fs.length;
		for (var i = 0; i < fs.length; i++) { 
			(function(f){
				var reader = new FileReader();
				reader.onload = function() {
					ParseData(this.result, f.name);
					itr -= 1;
					if (itr == 0)
						general_map();
				};
				reader.readAsText(f);
			})(fs[i]);
		}
		$("body").css("cursor", "default");		
	});
=======
$(function(){ 
	Route(false);
	$('#load').bootstrapFileInput();
	$('#toList').click(function(){ Route('#'); });
	$('#load').change(function(e){
		var fs = e.target.files;
		var ftotal = fs.length, stack = fs.length;
		for (var i = 0; i < fs.length; i++) { (function(f){
			var reader = new FileReader();
			reader.onload = function() {
				stack--;
				this.result.split('\n').map(function(line){
					var c = line.split('\t');
					if (chrs[c[0]]) {
						if (!expData[c[0]]) expData[c[0]] = {};
						if (!expData[c[0]][f.name]) expData[c[0]][f.name] = [];
						c[1] = parseInt(c[1])
						expData[c[0]][f.name].push(c.slice(1));
					}
				});
				if (stack == 0) {
					DataSort();
					Route(false);
				}
			};
			reader.readAsText(f);
		})(fs[i]); }
	});

>>>>>>> 07735be23618112eb30a69177e1bd82f59be8626
});
