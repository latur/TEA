"use strict";

var server  = 'https://te-atlas.ga/tea/app/';
var chrsSum = 3088269832;
var chrs = {
	'chr1':  248956422, 'chr2':  242193529, 'chr3':  198295559, 
	'chr4':  190214555, 'chr5':  181538259, 'chr6':  170805979, 
	'chr7':  159345973, 'chr8':  145138636, 'chr9':  138394717, 
	'chr10': 133797422, 'chr11': 135086622, 'chr12': 133275309, 
	'chr13': 114364328, 'chr14': 107043718, 'chr15': 101991189, 
	'chr16': 90338345,  'chr17': 83257441,  'chr18': 80373285, 
	'chr19': 58617616,  'chr20': 64444167,  'chr21': 46709983, 
	'chr22': 50818468,  'chrX':  156040895, 'chrY':  57227415
};

// Page containers
var hdr = $('#header')[0];
var doc = $('#content')[0];
var colors = [[0,220,0],[220,0,0],[0,0,220]];
var demo = ['MS2A','MS2B','MS2C','2nsready','2sready','3ns_merged'];

var expData   = {}; // {chr1 : {file1 : [], ..}, chr2 ...}
var expGroup  = false;
var expNames  = []; // [file1, file2, file3]
var expPoints = {}; // Positions info (for compare)
var samples   = {};

var cache = {}; // Cache for imagedata
var genesPane = false; // Open = true / Close = false / genes pane
var XHR = false;

String.prototype.repeat = function(num){
    return new Array( num + 1 ).join( this );
};

String.prototype.reverseComplement = function(){
	var inverse = { 'A' : 'T', 'G' : 'C', 'T' : 'A', 'C' : 'G'}, s = '';
	for(var i = this.length - 1; i >= 0 ; i--) s += inverse[this[i]];
	return s;
};

/* -------------------------------------------- */

// Отложенные действия
var Stack = (function(){
	var actions = {};
	return function(act, timer){
		if (!act) return;
		var ID = act.toString();
		if(actions[ID]) clearInterval(actions[ID]['timeout']);
		actions[ID] = {'timer' : timer || 500 };
		actions[ID]['timeout'] = setInterval(function(){
			if (actions[ID]['timer'] > 0) {
				return actions[ID]['timer'] -= 50;
			}
			clearInterval(actions[ID]['timeout']);
			act();
		}, 50);
	}
}());

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

var Cookie = (function(){
	function Get(name) {
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}
	function Set(name, val) {
		document.cookie = name + "=" + val;
	}
	return {Get : Get, Set : Set};
}());

// Heatmap of pictures
var HeatMap = (function(){
	var exp = {}, nms = [];
	var MakeImage = function(chr, w, h, height, _filter){
		var canvas = document.createElement('canvas');
		canvas.width = w, canvas.height = h;
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
		nms.map(function(f){
			if (exp[chr][f]) {
				var F = Array.apply(null, Array(w)).map(Number.prototype.valueOf, 1); // [0,0,0..]
				exp[chr][f].map(function(sm){
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
	return function(chr, size, samples){
		exp = expGroup ? expGroup : expData;
		nms = expGroup ? ['g1', 'g2'] : expNames;
		if (!exp[chr]) return ;
		if (!cache[size]) cache[size] = {};
		var width = $('.' + chr).width();
		var height = nms.length * size;
		if (!cache[size][chr]) cache[size][chr] = {
			'height'  : height,
			'type-1-common' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 1 && expPoints[id] > 1; }),
			'type-2-common' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 2 && expPoints[id] > 1; }),
			'type-3-common' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 3 && expPoints[id] > 1; }),
			'type-1-differ' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 1 && expPoints[id] == 1; }),
			'type-2-differ' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 2 && expPoints[id] == 1; }),
			'type-3-differ' : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 3 && expPoints[id] == 1; }),
			'type-1-all'    : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 1; }),
			'type-2-all'    : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 2; }),
			'type-3-all'    : MakeImage(chr, width, height, size, function(e,id){ return e[2] == 3; }),
			'samples' : samples
		};
		$('.' + chr).append( Template('hmd', cache[size][chr]) );
	}
}());

// Blur screen, Show message
var Msg = (function(){
	var opened = false;
	function Update(txt){
		if (!opened) return Show(txt);
		$('.message').html(txt);
	}
	function Log(txt){
		if (!opened) return Show(txt);
		$('.message').append(txt);
	}
	function Show(txt){
		if (opened) return Update(txt);
		opened = true;
		$('body > *').addClass('animate');
		$('body > *').addClass('blur');
		$('body').append( Template('message', {txt : txt}) );
		$('.background').fadeIn(300);
	}
	function Hide(){
		$('.blur').removeClass('blur');
		$('body > *').removeClass('animate');
		$('.background').fadeOut(300, function(){
			$(this).remove();
			opened = false;	
		});
	}
	return {Update: Update, Show: Show, Hide: Hide, Log:Log};
}());

/* -------------------------------------------- */

// Routing based on location.hash
function Route(loc){
	if (loc) location.hash = loc;

	// Show one chromosome
	var chr = location.hash.match(/^\#?(chr[0-9XY]+)\:([0-9,]+)\-([0-9,]+)$/);
	if (chr) return ShowChromosome(chr[1], parseInt(chr[2].replace(/,/g,'')), parseInt(chr[3].replace(/,/g,'')));

	// Main page
	var home = location.hash.match(/^\#?([a-z]+)?$/);

	// Detail (Show chromosome list)
	if (home[1] == 'detail') return ShowDetail();

	// General (Show chromosome line)
	if (home[1] == 'general') return ShowGeneral();
}

// Parse samples files. Separators: Col: "\t", Row: "\n"
function Parse(content, filename){
	expNames.push(filename);
	content.split('\n').map(function(line){
		var c = line.split('\t');
		if (!chrs[c[0]]) return ;
		if (!expData[c[0]]) expData[c[0]] = {};
		if (!expData[c[0]][filename]) expData[c[0]][filename] = [];
		c[1] = parseInt(c[1]);
		expData[c[0]][filename].push(c.slice(1));
		var ID = c[1] + c[0];
		if (c[7] == '') c[7] = "Unknown";
		if (!expPoints[ID]) expPoints[ID] = 0;
		expPoints[ID]++;
	});
}

// Search
var Finder = (function(){
	var actsList = [], opened = false, last = '';
	function Parse(str){
		if (last == str) return ;
		last = str;
		actsList = [];
		// Chromosome / position / interval
		var nma = str.match(/^\#?([0-9XY]+)\:?([0-9,]+)?\-?([0-9,]+)?$/); 
		var nmv = str.match(/^\#?(chr[0-9XY]+)\:?([0-9,]+)?\-?([0-9,]+)?$/);
		for (var chr in chrs) {
			if (nma && chr.indexOf(nma[1]) != -1 || nmv && chr.indexOf(nmv[1]) != -1){
				var x1 = (nma ? nma[2] : false) || (nmv ? nmv[2] : false);
				var x2 = (nma ? nma[3] : false) || (nmv ? nmv[3] : false);
				var tx = '';
				if (x1 && x2) {
					x1 = parseInt(x1.replace(/,/g, '')); x2 = parseInt(x2.replace(/,/g, ''));
					if (x2 > chrs[chr]) x2 = chrs[chr];
					var r = x2 > x1 ? [x1,x2] : [x2,x1];
					tx = ' <small>[' + r.join('-') + ']</small>';
					if (nma && chr.substr(3) != nma[1] || nmv && chr != nmv[1]) continue;
				} else 
				if (x1) {
					x1 = parseInt(x1);
					var r = [x1 - Math.min(x1, 5000), x1 + 5000];
					tx = ' <small>[' + r.join('-') + ']</small>';
				} else {
					var r = [150000, 580000];
				}
				var t = r[0].toLocaleString() + '-' + r[1].toLocaleString();
				actsList.push({
					title : 'Chromosome ' + chr.substr(3) + tx, 
					event : '#' + chr + ':' + t
				});
			}
		}
		
		if (actsList.length == 0 && str != '') {
			$.post(server + ['find', str].join('/'), {}, function(inf){
				if (inf.length > 0) {
					actsList = inf;
					Show();
				}
			}, "json");
		}
		Show();
	}
	function Show(){
		var html = actsList.slice(0,7).map(function(h){
			return Template('action', h);
		}).join('');
		$('#helper').html(html ? html : Template('helper-desc'));
		$('#helper .f-action').click(function(){
			actsList = [];
			$('#find').val('');
			Route($(this).data('act'));
		}).hover(function(){
			$('#helper .f-action').removeClass('sel');
			$(this).addClass('sel');
		});
		$('#helper').css({ opacity : 1, top : '32px' });
		opened = true;
	}
	function Hide(){
		$('#helper').css({ opacity : 0, top : '38px' });
		setTimeout(function(){ 
			$('#helper').html('');
		}, 350);
		opened = false;
	}

	$('#find').focusin(function(){
		Show();
	}).focusout(function(){
		Hide();
	}).keyup(function(){
		Parse($(this).val());
	});

	document.onkeydown = function(e){
		var cur = $('#helper .f-action.sel');
		// ESC
		if (e.keyCode == 27 && opened) return Hide();
		// Enter
		if (e.keyCode == 13){ 
			if (opened && actsList.length > 0) {
				$('#find').val('');
				Hide();
				return Route(cur.length == 0 ? actsList[0].event : cur.data('act'));
			}
			if (!opened) {
				$('#find').focus();
			}
		}
		if (actsList.length == 0) return ;

		// Down
		if (e.keyCode == 40) {
			if (cur.length == 0) {
				return $('#helper .f-action:first-child').addClass('sel');
			}
			if (cur.next().length > 0) {
				$('#helper .f-action').removeClass('sel');
				cur.next().addClass('sel')
			}
		}
		// UP
		if (e.keyCode == 38) {
			if (cur.length == 0) {
				return $('#helper .f-action:last-child').addClass('sel');
			}
			if (cur.prev().length > 0) {
				$('#helper .f-action').removeClass('sel');
				cur.prev().addClass('sel')
			}
		}
	}

}());

// Downloading samples from library
function Download(samples, onload, onstop){
	var onstop = onstop || function(){};
	if (samples.length == 0) return onstop();
	var name = samples.pop();
	XHR = $.post(server + 'data/' + name, {}, function(csv){
		Parse(csv, name);
		if (onload) onload(name);
		return Download(samples, onload, onstop);
	});
}

// Modal Box
function Modal(data){
	data['class'] = data['class'] ? data['class'] : 'default';
	$('<div class="modal fade" id="modal" tabindex="-1"></div>').appendTo('body');
	$('#modal').html( Template('modal', data) ).modal();
	$('#modal').on('hide.bs.modal', function(){ $(this).remove(); });
}

// Sort of retrotransposons in the order on the chromosome
function SamplesLoaded(){
	cache = {}; // Clear cache	
	samples = {};
	for (var chr in expData) {
		for (var f in expData[chr]) {
			expData[chr][f].map(function(e){
				if (!samples[f]) samples[f] = [];
				samples[f].push(e[0]);
			});
		}
	}

	if (location.hash == '#demo' || location.hash == '') location.hash = '#general';

	// Disable some function when number of file is lower than needed
	if (expNames.length > 0) $('.visible.type .btn').removeClass("disabled");
	if (expNames.length > 1) $('.visible.mode .btn').removeClass("disabled");
	if (expNames.length > 2) $('.samples-nav-pane .comparision').removeClass("disabled");
	if (expNames.length > 3) $('.samples-nav-pane .showtree').removeClass("disabled");

	Msg.Hide();
	Route();
}

