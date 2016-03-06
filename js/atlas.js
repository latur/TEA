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
// Cache for imagedata
var cache = {'hm' : {}};

/* -------------------------------------------- */
// Routing based on location.hash
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
				Pixel(xx, yy+1, col, 255);
				Pixel(xx, yy+2, col, 255);
				Pixel(xx, yy+3, col, 255);
				Pixel(xx+1, yy+1, col, 95);
				Pixel(xx+1, yy+2, col, 95);
				Pixel(xx+1, yy+3, col, 95);
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
	Object.keys(chrs).map(function(name, i){
		var chr = { name: name, width: chrs[name] * 100 / chrs.chr1, i: i };
		$('.side-' + i%2).append(Template('chr', chr))
	});
	$('#toList').addClass('disabled');
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
	$('#toList').removeClass('disabled');
	doc.innerHTML = name + ', ' + startBp + ': ' + endBp;
}

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

});
