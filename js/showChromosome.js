
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
	// Impossible states:
	if (!chrs[name] || end < start + 50) return Route('#general');
	// Insert HTML
	_HideIntro();

	// Insert HTML : panel + chromosome + svg-lines + zoom-area
	doc.innerHTML = Template('chromosome', {
		name: name,
		clist : Object.keys(chrs).map(function(chr){
			var part = Math.round(chrs[chr]/50);
			var center = [part * 25, part * 26].join('-');
			return '<a href="#'+chr+':'+center+'">' + chr + '</a>';
		}).join('')
	});

	var size = chrs[name];
	var place = $('#chr-one')[0], box = $('#sel-box')[0], sl = $('#range')[0];
	var svg = $('#ch-svg')[0], zoom = $('#ch-zoom-hm')[0];
	var sample = $('#samples')[0];
	var ww = sl.offsetWidth;
	var current = [0,1], ora = [0,1], detail = 0;

	svg.setAttribute('viewBox', '0 0 '+ww+' 30');
	svg.setAttribute('width', ww);

	// Actions:
	// InsertSamples(K) - use pixels (long time to write, not use with mousemove)
	// InsertSamples() - use percentage (quick-mode)
	var smove = false;
	var InsertSamples = function(K){
		if (!expData[name]) return ;
		// Mode:
		if (!K && smove) return;
		var PT = K ? 'px' : '%';
		var KF = K || 100/chrs[name];
		smove = true;
		sample.innerHTML = '';
		// Insert:
		Object.keys(expData[name]).map(function(f, i){
			var filedata = expData[name][f].map(function(spl, ind){
				return Template('zoom-trs', {
					comp: expPoints[spl[0] + name] > 1 ? '-common' : '-differ',
					id: i + '-' + ind, 
					f: f,
					ind: ind,
					type: spl[2], 
					name: spl[3],
					left: (spl[0] * KF) + PT
				});
			}).join('');
			sample.innerHTML += '<div class="spl-file">' + filedata + '</div>';
		});
		if (!K) return ;
		// Events:
		$('.spl a').click(function(){
			var info = expData[name][$(this).data('f')][$(this).data('i')];
			Modal({
				title : '<b>' + info[3] + '</b>. Chromosome: <kbd>' + name + '</kbd>. Position: <kbd>' + info[0] + '</kbd>',
				data  : '<pre>' + info[4].match(/.{1,60}/g).join('\n') + '</pre>'
			});
		});
	}
	
	// Mousemove-data => position in chromosome (bp)
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
	};
	
	// On Mousemove
	var ResizePre = function(xx){
		var e = RangeParse(xx[0], xx[1]);
		// Level of details:
		var bp = e[3] - e[2];
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
		
		// SVG-helper
		svg.innerHTML = '';
		svg.appendChild(SVGline(e[0]-1, 1));
		svg.appendChild(SVGline(e[1], ww));
		
		// Rulers
		var KPX = ww * ww / (e[1] - e[0]) / size;
		var scale = Math.pow(10, (parseInt(bp) + '').length - 1);
		var init  = Math.floor(e[2]/scale) * scale - 10 * scale;
		var R = '';
		
		console.log(e)
		console.log('')
		console.log(init)
		console.log(scale)

		for (var k = 0; k < 200; k++) {
			var label = init + k*scale + '';
			var ending = 'bp';
			if (label.substr(-6) == '000000') {
				ending = 'Mbp';
				label = label/1000000;
			} else if (label.substr(-3) == '000') {
				ending = 'Kbp';
				label = label/1000;
			}
			var bp = '<span>' + parseInt(label).toLocaleString().split(',').join('</span><span>') + '</span>' + ending;
			R += Template('rule', {width : scale * KPX, bp : bp, key : k%2});
		}

		var rul = $('#ruler')[0];
		rul.style.left = init * KPX + 'px';
		rul.innerHTML = R;

		InsertSamples();
	};

	var Resized = function(xx){
		console.log('Resized.. ' + xx.join('-'));
		smove = false;
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

		InsertSamples(KPX);

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
					var ex1 = t[5] ? t[5].split(',') : [];
					var ex2 = t[6] ? t[6].split(',') : [];
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
		//zoom.classList.add('animate');
	},function(){
		//zoom.classList.remove('animate');
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
}
