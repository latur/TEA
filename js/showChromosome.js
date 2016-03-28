// Rendering page with Сhromosome detail view
function ShowChromosome(name, start, end){
	// Validate:
	if (!chrs[name]) return Route('#general');
	if (end - start < 200) end -= 100, start += 100;
	if (end > chrs[name]) end = chrs[name];
	if (start < 0) start = 0;

	// Insert HTML template:
	_HideIntro();
	var chrList = Object.keys(chrs).map(function(chr){
		var part   = Math.round(chrs[chr]/50);
		var center = [part * 25, part * 26].join('-');
		return '<a href="#'+chr+':'+center+'">' + chr + '</a>';
	}).join('');
	doc.innerHTML = Template('chromosome', { name: name, clist : chrList });

	var H3K27Ac = [
		{name: 'GM12878', col : '255, 128, 128'},
		{name: 'H1-hESC', col : '255, 212, 128'},
		{name: 'HSMM',    col : '120, 235, 204'},
		{name: 'HUVEC',   col : '128, 212, 255'},
		{name: 'K562',    col : '128, 128, 255'},
		{name: 'NHEK',    col : '212, 128, 255'},
		{name: 'NHLF',    col : '255, 128, 212'}
	];

	// Variables: Chromosome
	var size = chrs[name];
	var box = $('#sel-box')[0], sel = $('#range')[0];
	var blurL = $('#blur-l')[0], blurR = $('#blur-r')[0];
	// Variables: Zoom-box
	var svg = $('#ch-svg')[0], svgL = $('#path-left')[0], svgR = $('#path-right')[0];;
	var zoom = $('#ch-zoom-hm')[0];
	var spls = $('#samples')[0];
	var rule = $('.rules');

	var ww = sel.offsetWidth, detail = 0;
	var H = {px:[0,0], bp:[0,0], kpx:1};
	svg.setAttribute('viewBox', '0 0 '+ww+' 30');
	svg.setAttribute('width', ww);

	// Actions:
	// - Parsing mousemove data (pixels -> bp)
	function Parse(a, b, k){
		H.px[0] = a > b ? b : a;
		H.px[1] = a > b ? a : b;
		if (H.px[1] > ww) H.px[1] = ww;
		if (H.px[0] <= 0) H.px[0] = 0;
		if (H.px[0] == H.px[1]) H.px[1]++;
		H.bp = [parseInt(H.px[0] * size / ww), parseInt(H.px[1] * size / ww)];
		if (!k) H.kpx = ww * ww / (H.px[1] - H.px[0]) / size;
	}

	// Round bp number
	function Name(val){
		var ending = 'bp';
		if ((val+'').substr(-6) == '000000') {
			ending = 'Mbp';
			val = val/1000000;
		} else if ((val+'').substr(-3) == '000') {
			ending = 'Kbp';
			val = val/1000;
		}
		return '<span>' + val.toLocaleString().split(',').join('</span><span>') + '</span>' + ending;
	}

	// - Preview of resize
	function Preview(rule){
		// Select-range-box
		box.style.left = H.px[0] - 1 + 'px';
		box.style.width = H.px[1] - H.px[0] + 1 + 'px';
		// Black blur "blinds"
		blurL.style.width = (H.px[0] * 100 / ww) + '%';
		blurR.style.left  = (H.px[1] * 100 / ww) + '%';
		// Svg
		var S = function(a, b){
			var l = 15 + 8 * Math.log(Math.abs((b - a) * 30 / 1000) + 0.001);
			return "M"+a+" 0 C "+a+" "+(l)+", "+b+" "+(30-l)+", "+b+" 30";
		};
		svgL.setAttribute("d", S(H.px[0], 1));
		svgR.setAttribute("d", S(H.px[1]-1, ww));

		// Zoom-box size (depend on scale)
		if (!rule) return ;
		zoom.style.width = H.kpx * size + 'px';
		zoom.style.marginLeft = - H.bp[0] * H.kpx + 'px';
	}

	// - Render content of selected region
	function Rend(){
		Preview(true);
		if (XHR) XHR.abort(), XHR = false;

		box.style.display = 'none';
		zoom.style.opacity = 1;
		zoom.classList.remove('blur')

		// Location bp
		location.hash = '#' + name + ':' + H.bp.join('-');
		$('#position')[0].innerHTML = name + ':' + H.bp.join('-');
		
		// Rulers
		var x1 = Math.max(H.bp[0] - H.bp[1] + H.bp[0], 0);
		var x2 = Math.min(H.bp[1] + H.bp[1] - H.bp[0], size);
		var inc = Math.pow(10, (parseInt((x2 - x1)/4) + '').length - 1);
		var p1 = Math.floor(x1/inc) * inc;
		rule.css({ left : p1 * H.kpx  + 'px' });
		var R = '', bp = '';
		while(p1 < x2 + 10 * inc) {
			R += Template('rule', {width : inc * H.kpx, bp : Name(p1)});
			p1 += inc;
		}
		rule.html(R);
		
		// Genes + Bind-levels
		detail = 0, bp = H.bp[0] - H.bp[1];
		if (bp < 90000000) detail++; // L
		if (bp <  8000000) detail++; // M
		if (bp <  5500000) detail++; // S
		if (bp <  2000000) detail++; // XS
		var genes = $('#genes')[0], blevel = $('#bindlevel')[0];
		var mode = ['-','L','M','S','XS'][detail];
		if (detail == 0) return genes.innerHTML = Template('zoom-Zero', {name : name});

		XHR = $.post(server + [mode, name, x1, x2].join('/'), {}, function(inf){
			var inf  = inf.split('\n');
			var genesInfo = inf[0].split(';').map(function(row){
				var r = row.split(':');
				r[0] = parseInt(r[0], 32);
				if (r[1]) r[1] = parseInt(r[1], 32);
				return r;
			});

			var bindInfo = inf[1].split(';').map(function(btype){
				if (btype == 0) return false;
				var BT = btype.split(':');
				BT[2] = BT[2].split(',').map(function(v){ return parseInt(v, 36); });
				return BT;
			});
			blevel.innerHTML = bindInfo.map(function(BT, k){
				if (!BT) return '';
				var line = '0,100';
				for (var i in BT[2]) line += ' ' + (BT[1] * i * H.kpx) + ',' + Math.min(100,(100 - BT[2][i]/100));
				var send = Math.round(BT[1] * BT[2].length * H.kpx) + 1;
				line += ' ' + send + ',100';
				return Template('bindlevel', {
					color  : H3K27Ac[k].col,
					points : line,
					left   : BT[0] * H.kpx,
					width  : send
				});
			}).join('');
			
			// L - points
			if (mode == 'L'){
				genes.innerHTML = genesInfo.map(function(t){
					return Template('zoom-L', { left : t[0] * H.kpx });
				}).join('');
			}
			// M - intrvals
			if (mode == 'M') {
			}
			// S - intrvals + names
			if (mode == 'S') {
			}
			// XS - intrvals + names + exons
			if (mode == 'XS') {
			}
		});
	}
	
	function Align(vars){
		var lines = [0];
		// vars
	}


	// Events:
	var px,ox,dx, tx,vx,ix;
	// Select range (chromosome)
	sel.onmousedown = function(e){
		ox = e.offsetX;
		px = e.pageX;
	};
	rule.mousedown(function(e){
		tx = e.pageX;
		ix = [H.px[0], H.px[1]];
	});
	document.onmousemove = function(e){
		// Select range (chromosome) ?
		if (!isNaN(ox)) {
			if (isNaN(dx)) {
				box.style.display = 'block';
				zoom.style.opacity = 0.2;
				zoom.classList.add('blur')
			}
			dx = e.pageX - px;
			Parse(ox, ox + dx, true);
			Preview();
		}
		// Move range (rule) ?
		if (!isNaN(tx)) {
			if (isNaN(vx)) {
				box.style.display = 'block';
			}
			vx = (e.pageX - tx) * ww / (H.kpx * size);
			Parse(ix[0] - vx, ix[1] - vx, true);
			Preview(true);
		}
	};
	document.onmouseup = function(e){
		if (!isNaN(dx)) {
			Parse(ox, ox + dx);
			Rend();
		}
		if (!isNaN(vx)) {
			Parse(ix[0] - vx, ix[1] - vx);
			Rend();
		}
		ox = NaN, px = NaN, dx = NaN, tx = NaN, vx = NaN;
	};

	// Buttons:
	$('.move-c a.cnt').hover(function(){
		zoom.classList.add('animate');
	},function(){
		zoom.classList.remove('animate');
	}).click(function(){
		var inc = parseFloat($(this).data('e'));
		var p = inc * (H.px[1] - H.px[0]);
		var x1 = H.px[0] + p, x2 = H.px[1] + p;
		if (x1 <  0) { x1 = 0; x2 = H.px[1] - H.px[0]; }
		if (x2 > size) { x2 = size; x1 = size - H.px[1] + ora[0]; }
		Parse(x1, x2);
		Rend();
	});

	$('.zoom-c a.cnt').click(function(){
		var inc = parseFloat($(this).data('e'));
		var center = (H.bp[1] + H.bp[0])/2;
		var padding = inc * (H.bp[1] - H.bp[0])/2;
		if (padding < 100) padding = 100;
		var x1 = (center - padding) > 0 ? center - padding : 0; 
		var x2 = (center + padding) > size ? size : center + padding; 
		Parse(x1 * ww / size, x2 * ww / size);
		Rend();
	});
	$('.chr-btn .dropdown-menu a').click(function(){
		Route($(this).attr('href'));
	});

	Parse(ww * start / size, ww * end / size);
	Rend();
}
