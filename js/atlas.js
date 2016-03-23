"use strict";

const server  = 'http://dev.mazepa.us/tea/app/';
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

var expData  = {}; // {chr1 : {file1 : [], ..}, chr2 ...}
var expNames = []; // [file1, file2, file3]
var Group = {};

// Page containers
var hdr = $('#header')[0];
var doc = $('#content')[0];

// Cache for imagedata
var cache = {};
// Cache for position
var cachePoints = {};
var XHR = false;

/* -------------------------------------------- */

const density_len = {
	'chr1': 125,	'chr2': 122,	'chr3': 100,
	'chr4': 96,	'chr5': 91, 	'chr6': 86,
	'chr7': 80,	'chr8': 73,	'chr9': 70,
	'chr10': 67,	'chr11': 68,	'chr12': 67,
	'chr13': 58,	'chr14': 54,	'chr15': 51,
	'chr16': 46,	'chr17': 42,	'chr18': 41,
	'chr19': 30,	'chr20': 33,	'chr21': 24,
	'chr22': 26,	'chrX': 79,	'chrY': 29
};
const TE_type = ["Alu", "Line", "Others"];
var file_list = [], id_list = {}, group_list = [], n_group = 0;
var n_file = 0;
var density_map = {}, d_max = 0, g_density = {}, g_max;
var tree = [];
var color = ["green", "red", "blue"];
var line_view = true;

/* -------------------------------------------- */

// The template. Obtaining a template name and pasting data
var Template = (function(classname){
	var templates = {};
	$(classname).each(function(){
		templates[$(this).data('name')] = $(this).html();
	});
	return function(name, data){
		var html = templates[name];
		for (var e in data){
			var find = new RegExp("{" + e + "}", "g");
			html = html.replace(find, data[e] == undefined ? '' : data[e]);
		}
		return html;
	}
}('.template'));

// Display mute
function MuteMessage(txt){
	$('body > *').addClass('animate');
	$('body > *').addClass('blur');
	$('body').append( Template('message', {txt : txt}) );
	$('.background').fadeIn(300);
}
function MessageClose(){
	$('.blur').removeClass('blur');
	$('body > *').removeClass('animate');
	$('.background').fadeOut(300, function(){
		$(this).remove();	
	});
}

// Routing based on location.hash
function Route(loc){
	if (loc) location.hash = loc;
	// Show one chromosome
	var chr = location.hash.match(/^\#?(chr[0-9XY]+)\:([0-9]+)\-([0-9]+)$/);
	if (chr) return ShowChromosome(chr[1], parseInt(chr[2]), parseInt(chr[3]));

	var home = location.hash.match(/^\#?([a-z]+)?$/);
	// Detail (Show chromosome list)
	if (home[1] == 'detail')  ShowDetail();
	// General (Show chromosome line)
	if (home[1] == 'general') ShowGeneral();
}

// Downloading samples
function Download(samples, onload, onstop){
	var onstop = onstop || function(){};
	if (samples.length == 0) return onstop();
	var name = samples.pop();
	XHR = $.post(server + 'sample/' + name, {}, function(csv){
		Parse(csv, name);
		if (onload) onload(name);
		return Download(samples, onload, onstop);
	});
}

// Heatmap pictures
function _SamplesHMImage(chr, w, h, _filter, height){
	var colors = [[220,0,0],[0,220,0],[0,0,220]];
	var canvas = document.createElement('canvas');
	canvas.width  = w, canvas.height = h;
	var ctx = canvas.getContext('2d');
	var cdt = ctx.getImageData(0, 0, w, h);
	var Pixel = function(x, y, color, a){
		var ind = (y * w + x) * 4;
		cdt.data[ind + 0] = color[0]; // R
		cdt.data[ind + 1] = color[1]; // G
		cdt.data[ind + 2] = color[2]; // B
		cdt.data[ind + 3] += a; // A
	};
	var Line = function(x, y1, y2, color){
		while (y1 < y2) { Pixel(x, y1, color, 100); y1++; }
	};
	var y = 0;
	var K = w / chrs[chr];
	expNames.map(function(f){
		if (expData[chr][f]) {
			var F = Array.apply(null, Array(w)).map(Number.prototype.valueOf, 1); // [0,0,0..]
			expData[chr][f].map(function(sm){
				if (!_filter(sm, sm[0] + chr)) return;
				var col = colors[sm[2]-1],
					xx = Math.floor(K * sm[0]), 
					yy = y + height/2;
				if (F[xx] < height/2) F[xx]++;
				Line(xx, yy - F[xx], yy + F[xx], col);
			});
		}
		y += height;
	});
	ctx.putImageData(cdt, 0, 0);
	return canvas.toDataURL();
}
function SamplesHM(chr, size, samples){
	if (!expData[chr]) return ;
	if (!cache[size]) cache[size] = {};
	var width = $('.' + chr).width();
	var height = expNames.length * size;
	if (!cache[size][chr]) cache[size][chr] = {
		'height'  : height,
		'type-1-common' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 1 && cachePoints[id] > 1; }, size),
		'type-2-common' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 2 && cachePoints[id] > 1; }, size),
		'type-3-common' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 3 && cachePoints[id] > 1; }, size),
		'type-1-differ' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 1 && cachePoints[id] == 1; }, size),
		'type-2-differ' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 2 && cachePoints[id] == 1; }, size),
		'type-3-differ' : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 3 && cachePoints[id] == 1; }, size),
		'type-1-all'    : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 1; }, size),
		'type-2-all'    : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 2; }, size),
		'type-3-all'    : _SamplesHMImage(chr, width, height, function(e,id){ return e[2] == 3; }, size),
		'samples' : samples
	};
	$('.' + chr).append( Template('hmd', cache[size][chr]) );
}

// Parse samples files. Separators: Col: "\t", Row: "\n"
function Parse(content, filename){
	expNames.push(filename);
	content.split('\n').map(function(line){
		var c = line.split('\t');
		if (!chrs[c[0]]) return ;
		if (!expData[c[0]]) expData[c[0]] = {};
		if (!expData[c[0]][filename]) expData[c[0]][filename] = [];
		expData[c[0]][filename].push(c.slice(1));
		var ID = c[1] + c[0];
		if (!cachePoints[ID]) cachePoints[ID] = 0;
		cachePoints[ID]++;
	});
}
function ParseNEW(content, filename){
	expNames.push(filename);
	file_list.push(filename);
	++n_file;

	content.split('\n').map(function(line){
		var c = line.split('\t');
		if (chrs[c[0]]) {
			if (!expData[c[0]]){
				expData[c[0]] = {};
				density_map[c[0]] = {};
			}

			if (!expData[c[0]][filename]){
				 expData[c[0]][filename] = [];
				density_map[c[0]][filename] = [];
				for (var i = 0; i < density_len[c[0]]; i++)
					density_map[c[0]][filename].push([0,0,0,0,0,0]);
			}

			c[1] = parseInt(c[1]);
			c[2] = parseInt(c[2]);
			c[3] = parseInt(c[3]);
			var id = c[0] + '-' + filename + '-' + c[1] + '-' + c[2];
			c.push(id);
			expData[c[0]][filename].push(c.slice(1));

			// Use to draw density map
			var cell = Math.ceil(c[1]/2000000)-1;
			if (cell >= density_len[c[0]]) cell = density_len[c[0]]-1;

			++density_map[c[0]][filename][cell][c[3]-1];

			// Use to trace for turn on/off element and show inf when needed
			id_list[id] = 0;
		}
	});
}

// Modal Box
function Modal(data){
	data['class'] = data['class'] ? data['class'] : 'default';
	$('<div class="modal fade" id="modal" tabindex="-1"></div>').appendTo('body');
	$('#modal').html( Template('modal', data) ).modal();
	$('#modal').on('hide.bs.modal', function(){
		$(this).remove();
	});
}

// Sort of retrotransposons in the order on the chromosome
function SamplesLoaded(){
	// Disable some function when number of file is lower than needed
	$('.samples-nav-pane .comparision').removeClass("disabled");
	if (expNames.length < 2) $('.samples-nav-pane .comparision').addClass("disabled");
	if (expNames.length < 3) $('.samples-nav-pane .showtree').addClass("disabled");

	cache = {}; // Clear cache	

	if (location.hash == '') location.hash = '#general';
	MessageClose();
	Route();
	return true;
}

/* -------------------------------------------- */

// Mouse actions: select a chromosome
function _ShowHelper(){
	var offset = 5000000;
	$('.chr-box').each(function(){
		var e = $(this)[0], name = $(this).data('name');
		var K = chrs[name]/$(this).width();
		$(this).mousemove(function(h){
			e.children[0].style.left = h.offsetX + 'px';
			var pt = parseInt(h.offsetX * K);
			var start = pt - offset < 0 ? 0 : pt - offset;
			var stop  = pt + offset > chrs[name] ? chrs[name] : pt + offset;
			e.children[0].innerHTML = name + ":" + start + "-" + stop;
		}).click(function(){
			var loc = $(this).children('.helper').html();
			Route(loc);
		});
	});
}
// Add samples pane, hide initial pane
function _HideIntro(){
	$('.mini-controls').remove();
	$('.intro').addClass('pad').removeClass('intro');
	$('.extended-controls').fadeIn();
	$('.v-mode a').removeClass('disabled');
}

// Showing chromosomes in two vertical list
function ShowDetail(){
	_HideIntro();
	$('.v-mode .detail').addClass('disabled');
	doc.innerHTML = Template('chr-list');
	Object.keys(chrs).map(function(name, i){
		var chr = { title: name, name: name, style : '', width: chrs[name] * 100 / chrs.chr1, i: i };
		$('.side-' + i%2).append( Template('chr', chr) );
	});
	_ShowHelper();
	var samples = expNames.map(function(f){ return '<div class="fn"><span>' + f + '</span></div>'; }).join('');
	Object.keys(expData).map(function(chr){
		SamplesHM(chr, 12, samples);
	}); // Heatmap of samples
}

// Showing chromosomes as one line
function ShowGeneral(){
	_HideIntro();
	$('.v-mode .general').addClass('disabled');
	doc.innerHTML = Template('chr-line');
	Object.keys(chrs).map(function(name, i){
		var style = 'width:' + (chrs[name] * 100 / chrsSum - 0.15) + '%'; // 0.15 is margin
		var title = i > 10 ? name.substr(3) : name;
		var chr = { title: title, name: name, style : style, width: 100, i: i };
		$('.chr-line').append( Template('chr', chr) )
	});
	_ShowHelper();
	Object.keys(expData).map(function(chr){
		SamplesHM(chr, 36, "");
	}); // Heatmap of samples
	// Sample-names:
	$('.chr-line-names').html(expNames.map(function(f){
		return '<div class="fn"><span>' + f + '</span></div>';
	}).join(''));
}

// SVG-Line
function SVGline(p1, p2){
	if (p1 < 0) p1 = 0;
	var v = Math.abs((p1 - p2) * 30 / 1000);
	var l = 15 + 8 * Math.log(v+0.001);
	var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
	shape.setAttributeNS(null, "d", "M"+p1+" 0 C "+p1+" "+(l)+", "+p2+" "+(30-l)+", "+p2+" 30");
	shape.setAttributeNS(null, "fill", "none");
	shape.setAttributeNS(null, "stroke", "#222");
	return shape;	
}

// Selected region on chromosome
function ShowChromosome(name, start, end){
	_HideIntro();
	// Impossible states:
	if (!chrs[name] || end < start + 50) return Route('#general');
	// Html elements:
	var samples = '';
	if (expData[name]) {
		Object.keys(expData[name]).map(function(f, i){
			var samplefile = expData[name][f].map(function(spl, ind){
				//if (!visibleType[spl[2]]) return '';
				return Template('zoom-trs', {
					id: i + '-' + ind, 
					f: f,
					ind: ind,
					type: spl[2], 
					left: spl[0] * 100 / chrs[name],
					name: spl[3]
				});
			}).join('');
			samples += '<div class="spl-file">' + samplefile + '</div>';
		});
	}

	var clist = Object.keys(chrs).map(function(chr){
		var part = Math.round(chrs[chr]/50);
		var center = [part * 25, part * 26].join('-');
		return '<a href="#'+chr+':'+center+'">' + chr + '</a>';
	}).join('');

	doc.innerHTML = Template('chromosome', { name: name, samples: samples, clist : clist });

	$('.spl a').click(function(){
		var info = expData[name][$(this).data('f')][$(this).data('i')];
		Modal({
			title : '<b>'+info[3]+'</b>. Chromosome: <kbd>'+name+'</kbd>. Position: <kbd>'+info[0]+'</kbd>',
			data  : '<pre>' + info[4].match(/.{1,60}/g).join('\n') + '</pre>'
		});
	});

	// Events
	var size = chrs[name];
	var svg = $('#ch-svg')[0];
	var sl = $('#range')[0], zoom = $('#ch-zoom-hm')[0], place = $('#chr-one')[0], box = $('#sel-box')[0];
	var ww = sl.offsetWidth;
	var current = [0,1], ora = [0,1], detail = 0;

	svg.setAttribute('viewBox', '0 0 '+ww+' 30');
	svg.setAttribute('width', ww);
	
	var RangeParse = function(start, end){
		// to pixels
		var x1 = ww * start / size; 
		var x2 = ww * end / size;
		ora = start < end ? [start, end] : [end, start];
		var e = x2 > x1 ? [x1, x2] : [x2, x1];
		current = [e[0] < 0 ? 0 : e[0], e[1] > ww ? ww : e[1]];
		current.push(start > end ? end : start)
		current.push(start > end ? start : end)
		return current;
	}
	
	var ResizePre = function(xx){
		var e = RangeParse(xx[0], xx[1]);
		// Level of details:
		var bp = xx[1] - xx[0];
		detail = 0;
		zoom.classList.remove('det-1');
		zoom.classList.remove('det-2');
		zoom.classList.remove('det-3');
		if (bp < 90000000) detail++, zoom.classList.add('det-' + detail); // L
		if (bp <  8000000) detail++, zoom.classList.add('det-' + detail); // M
		if (bp <  5500000) detail++, zoom.classList.add('det-' + detail); // S
		if (bp <  3000000) detail++, zoom.classList.add('det-' + detail); // XS

		// Detail-line
		zoom.style.width = ww * 100 / (e[1] - e[0]) + '%';
		zoom.style.marginLeft = - e[0] * 100 / (e[1] - e[0]) + '%';
		// Select-range-box
		
		box.style.left = e[0] + 'px';
		box.style.width = e[1] - e[0] + 'px';
		
		svg.innerHTML = '';
		svg.appendChild(SVGline(e[0]-1, 1));
		svg.appendChild(SVGline(e[1], ww));
	};

	var Resized = function(xx){
		console.log('Resized.. ' + xx.join('-'));
		if (xx[0] > xx[1]) xx = [xx[1], xx[0]];
		var e = RangeParse(xx[0], xx[1]);
		if (XHR) XHR.abort(), XHR = false;
		ResizePre(xx);
		
		// black blur "blinds"
		$('#cs-lh-F')[0].style.width = (e[0] * 100 / ww) + '%';
		$('#cs-rh-F')[0].style.left  = (e[1] * 100 / ww) + '%';

		// Hash
		var bp1 = parseInt(e[2]);
		var bp2 = parseInt(e[3]);
		location.hash = '#' + name + ':' + (bp1 > 0 ? bp1 : 0) + '-' + bp2;
		$('#position')[0].innerHTML = (name + ':' + (bp1 > 0 ? bp1 : 0) + '-' + bp2);

		// Samples
		var KPX = ww * ww / (e[1] - e[0]) / size;
		var Place = function(lines, point){
			for (var i in lines) if (point > lines[i]) return i;
			return false;
		};

		if (expData[name]){
			Object.keys(expData[name]).map(function(f, i){
				var lines = [0], tr, ins, val;
				for (var ind = 0; ind < expData[name][f].length; ind++) {
					var te = $('#trs-' + i + '-' + ind);
					if (te.length == 0) continue;
					tr  = expData[name][f][ind];
					val = tr[0] * KPX + 5;
					ins = Place(lines, tr[0] * KPX);
					if (detail > 0) val += tr[3].length * 6.61 + 20;
					val = parseInt(val);
					if (ins !== false) {
						lines[ins] = val;
					} else {
						ins = lines.length;
						lines.push(val);
					}
					te[0].style.top = ins * 12 + 3 + 'px';
					if (tr[0] < size * e[0]/ww || tr[0] > size * e[1]/ww) continue;
					if (tr[0] < xx[0] || tr[0] > xx[1]) continue;
					te[0].parentNode.style.height = lines.length * 12 + 6 + 'px';
				}
			});
		}

		if (detail == 0) return $('#genes')[0].innerHTML = '';
		var mode = ['-','L','M','S','XS'][detail];
		var range = bp2 - bp1;
		var from = bp1 - range;
		var req = [mode, name, from > 0 ? from : 0, bp2 + range].join('/');
		var genes = $('#genes')[0];

		XHR = $.post(server + req, {}, function(inf){
			var inf = inf.split('\n')
			//var t = inf[1].split(':');
			//var bindlevel = {init : parseInt(t[0]), step: parseInt(t[1]), arr : t[2].split(',')};

			genes.style.height = '23px';
			var data = inf[0].split(';').map(function(row){
				var r = row.split(':');
				r[0] = parseInt(r[0], 32);
				if (r[1]) r[1] = parseInt(r[1], 32);
				return r;
			});
			// L - inits
			if (mode == 'L') {
				genes.innerHTML = data.map(function(t){
					return Template('zoom-L', { left : t[0] * 100 / size });
				}).join('');
				return ;
			}
			// M - intrvals
			var lines = [0], ins, val;
			if (mode == 'M') {
				genes.innerHTML = data.map(function(t){
					var w = t[1] * KPX;
					ins = Place(lines, t[0] * KPX);
					val = parseInt(t[0] * KPX + t[1] * KPX + 1);
					if (ins !== false) {
						lines[ins] = val;
					} else {
						ins = lines.length;
						lines.push(val);
					}
					if (bp2 > t[0] && t[0] > bp1) genes.style.height = lines.length * 8 + 6 + 'px';
					return Template('zoom-M', {
						left  : t[0] * 100 / size,
						width : w > 1 ? w : 1,
						top   : ins * 8 + 3
					});
				}).join('');
			}
			// S - intrvals + names
			if (mode == 'S') {
				genes.innerHTML = data.map(function(t){
					var w = t[1] * KPX + 2;
					var title = (t[4] == '+' ? '&gt;' : '&lt;') + t[2];
					if (t[3]) title += ', ' + t[3];
					ins = Place(lines, t[0] * KPX);
					val = parseInt(t[0] * KPX + t[1] * KPX + (t[2] + t[3]).length * 6.61 + 55);
					if (ins !== false) {
						lines[ins] = val;
					} else {
						ins = lines.length;
						lines.push(val);
					}
					if (bp2 > t[0] && t[0] > bp1) genes.style.height = lines.length * 13 + 6 + 'px';
					return Template('zoom-S', {
						left  : t[0] * 100 / size,
						width : w > 1 ? w : 1,
						top   : ins * 13 + 3,
						title : title
					});
				}).join('');
			}
			// XS - intrvals + names + exons
			if (mode == 'XS') {
				// var level = bindlevel.arr.map(function(t){
				// 	var l = parseInt(t, 36)/100;
				// 	l = Math.round(Math.log(l));
				// });
				// var X1 = bindlevel.init * KPX;
				// var WW = bindlevel.arr.length * bindlevel.step * KPX
				// $('#bindlevel')[0].innerHTML = Template('bindlevel', {left : X1, width : WW });
				
				// <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				// 	<polyline points="10,2  60,2  35,52" style="stroke:#006600; stroke-width: 2; fill: #33cc33;"/>
				// </svg>
				
				genes.innerHTML = data.map(function(t){
					var w = t[1] * KPX + 2;
					var title = (t[4] == '+' ? '&gt; ' : '&lt; ') + t[2];
					if (t[3]) title += ', ' + t[3];
					ins = Place(lines, t[0] * KPX);
					val = parseInt(t[0] * KPX + t[1] * KPX + (t[2] + t[3]).length * 6.61 + 55);
					if (ins !== false) {
						lines[ins] = val;
					} else {
						ins = lines.length;
						lines.push(val);
					}
					var ex1 = t[5].split(',');
					var ex2 = t[6].split(',');
					var exons = '';
					for (var k = 0; k < ex1.length - 1; k++) {
						var exleft = (ex1[k] - t[0]) * KPX;
						var exwidth = (ex2[k] - ex1[k]) * KPX;
						exons += '<div class="exon bx" style="left:' + exleft + 'px; width:'+exwidth+'px"></div>';
					}

					if (bp2 > t[0] && t[0] > bp1) genes.style.height = lines.length * 13 + 6 + 'px';
					return Template('zoom-XS', {
						left  : t[0] * 100 / size,
						width : w > 1 ? w : 1,
						top   : ins * 13 + 3,
						title : title,
						exons : exons
					});
				}).join('');
			}
		});
	};

	// Document
	var px,ox,dx, tx,vx,ix;
	// Select range (chromosome)
	sl.onmousedown = function(e){
		ox = e.offsetX;
		px = e.pageX;
	};
	zoom.onmousedown = function(e){
		tx = e.pageX;
		ix = current;
	};
	document.onmousemove = function(e){
		// Select range ?
		if (!isNaN(ox)) {
			if (isNaN(dx)) box.style.display = 'block';
			dx = e.pageX - px;
			// px1 * size / ww = start;
			// px2 * size / ww = end;
			ResizePre([(ox) * size / ww, (ox + dx) * size / ww]);
		}
		// Move range ?
		if (!isNaN(tx)) {
			if (isNaN(vx)) box.style.display = 'block';
			vx = - (e.pageX - tx) * (ix[1] - ix[0]) / ww;;
			// px1 * size / ww = start;
			// px2 * size / ww = end;
			ResizePre([(ix[0] + vx) * size / ww, (ix[1] + vx) * size / ww]);
		}
	};
	document.onmouseup = function(e){
		if (!isNaN(dx)) {
			Resized([(ox) * size / ww, (ox + dx) * size / ww]);
		}
		if (!isNaN(vx)) {
			Resized([(ix[0] + vx) * size / ww, (ix[1] + vx) * size / ww]);
		}
		box.style.display = 'none';
		ox = NaN, px = NaN, dx = NaN, tx = NaN, vx = NaN;
	};
	document.onresize = function(){
		ww = sl.offsetWidth;
	};
	
	// Buttons:
	$('.move-c a.cnt').hover(function(){
		zoom.classList.add('animate');
	},function(){
		zoom.classList.remove('animate');
	}).click(function(){
		var inc = parseFloat($(this).data('e'));
		var p = inc * (ora[1] - ora[0]);
		var x1 = ora[0] + p, x2 = ora[1] + p;
		if (x1 <  0) { x1 = 0; x2 = ora[1] - ora[0]; }
		if (x2 > size) { x2 = size; x1 = size - ora[1] + ora[0]; }
		Resized([x1, x2]);
	});
	$('.zoom-c a.cnt').hover(function(){
		zoom.classList.add('animate');
	},function(){
		zoom.classList.remove('animate');
	}).click(function(){
		var inc = parseFloat($(this).data('e'));
		var cen = (ora[1] + ora[0])/2;
		var upg = inc * (ora[1] - ora[0]) / 2;
		if (upg < 100) upg = 100;
		var x1 = cen - upg, x2 = cen + upg;
		if (x1 < 0) x1 = 0;
		if (x2 > size) x2 = size;
		Resized([x1, x2]);
	});
	$('.chr-btn .dropdown-menu a').click(function(){
		Route($(this).attr('href'));
	});
	
	
	
	// [px1, px2] = [ww * start / size, ww * end / size]
	// px1 * size / ww = start;
	// px2 * size / ww = end;
	Resized([start, end]);
	$(".status").css("visibility", "hidden");
}


