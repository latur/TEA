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
		detail = 0, bp = H.bp[1] - H.bp[0];
		if (bp < 90000000) detail++; // L
		if (bp <  8000000) detail++; // M
		if (bp <  5500000) detail++; // S
		if (bp <  2000000) detail++; // XS
		var genes = $('#genes')[0], bgraph = $('#bind-graph')[0], bpanel = $('#bind-panel')[0];
		var mode = ['L','L','M','S','XS'][detail];

		// Samples
		spls.innerHTML = '';
		if (expData[name]) {
			Object.keys(expData[name]).map(function(f,i){
				console.log(expData[name][f]);
				var prepare = expData[name][f].sort(function(a,b){
					if (a[0] > b[0]) return 1;
					if (a[0] < b[0]) return -1;
					return 0
				}).map(function(spl, ind){
					var tr = {
						id   : i + '-' + ind, 
						f    : f,
						ind  : ind,
						type : spl[2], 
						vis  : false,
						comp : expPoints[spl[0] + name] > 1 ? '-common' : '-differ',
						left : (spl[0] * H.kpx)
					};
					tr.name = detail > 0 ? (spl[3] + '  ') : '';
					tr.space = tr.name.length * 6.65;

					if (spl[0] > H.bp[0] && spl[0] < H.bp[1]) tr.vis = 'inw';
					if (spl[1] > H.bp[0] && spl[0] < H.bp[1]) tr.vis = 'inw';
					if (spl[0] < H.bp[0] && spl[1] > H.bp[1]) tr.vis = 'inw';
					return tr;
				});
				var _ = Align(prepare, 12);
				var html = _.el.map(function(e){ return Template('zoom-trs', e); }).join('');
				spls.innerHTML += '<div class="spl-file" style="height: '+_.h+'px">'+html+'</div>';
			});
		}

		$('.spl a').click(function(){
			var info = expData[name][$(this).data('f')][$(this).data('i')];
			Modal({
				title : '<b>' + info[3] + '</b>. Chromosome: <kbd>' + name + '</kbd>. Position: <kbd>' + info[0] + '</kbd>',
				data  : '<pre>' + info[4].match(/.{1,60}/g).join('\n') + '</pre>'
			});
		});

		

		XHR = $.post(server + [mode, name, x1, x2].join('/'), {}, function(inf){
			var inf  = inf.split('\n');

			// Bind-levels
			var bingPanel = '', bingGraph = '';
			var bindInfo = inf[1].split(';').map(function(btype, k){
				if (btype == 0) return false;
				var BT = btype.split(':');
				BT[2] = BT[2].split(',').map(function(v){ return parseInt(v, 36); });
				// Draw:
				var line = '0,100';
				for (var i in BT[2]) line += ' ' + (BT[1] * i * H.kpx) + ',' + Math.min(100,(100 - BT[2][i]/100));
				var send = Math.round(BT[1] * BT[2].length * H.kpx) + 1;
				line += ' ' + send + ',100';
				bingGraph += Template('bindlevel', {
					color  : H3K27Ac[k].col,
					points : line,
					left   : BT[0] * H.kpx,
					key    : k,
					width  : send
				});
				bingPanel += Template('bindpanel', {
					color  : H3K27Ac[k].col,
					name   : H3K27Ac[k].name,
					key    : k
				});
			});
			bgraph.innerHTML = bingGraph;
			bpanel.innerHTML = bingPanel;
			$('.bind-swith').click(function(){
				var nm = 'bl-hide' + $(this).data('k');
				$('body')[$('body').hasClass(nm) ? 'removeClass' : 'addClass'](nm);
			});
			
			genes.style.height = 'auto';
			if (detail == 0) return genes.innerHTML = Template('zoom-Zero', {name : name});;
			// Genes
			var genesInfo = inf[0].split(';').map(function(row){
				var t = row.split(':');
				t[0] = parseInt(t[0], 32);
				var gene = {
					left  : t[0] * H.kpx,
					dir   : t[4] == '+' ? 'dirR' : 'dirL',
					width : 1,
					name  : '',
					exons : '',
					space : 1,
					vis   : ''
				};
				if (t[1]){
					gene.width = parseInt(t[1], 32) * H.kpx;
				}
				if (t[2]) {
					gene.name = t[2] + (t[3] ? ', ' : '') + (t[3] || '');
					gene.space = gene.width + name.length * 6.63 + 150;
				}

				if (t[0] > H.bp[0] && t[0] < H.bp[1]) gene.vis = 'inw';
				if (t[1] > H.bp[0] && t[0] < H.bp[1]) gene.vis = 'inw';
				if (t[0] < H.bp[0] && t[1] > H.bp[1]) gene.vis = 'inw';
				
				var ex1 = t[5] ? t[5].split(',') : [];
				var ex2 = t[6] ? t[6].split(',') : [];
				for (var k = 0; k < ex1.length - 1; k++) {
					var exleft  = (ex1[k] - t[0]) * H.kpx;
					var exwidth = (ex2[k] - ex1[k]) * H.kpx + 1;
					gene.exons += '<div class="exon bx" style="left:' + exleft + 'px; width:'+exwidth+'px"></div>';
				}
				return gene;
			});
			
			var _ = Align(genesInfo, 12);
			genes.innerHTML = _.el.map(function(e){ return Template('zoom-' + mode, e); }).join('');
			genes.style.height = Math.max(70, _.h) + 'px';
			bpanel.style.top = Math.max(70, _.h) + 24 + 'px';
		});
	}
	
	// HTML-helpers: multiple lines
	function Align(elements, one){
		var visHeight = one;
		var lines = [0];
		var Can = function(p){
			for (var i in lines) if (p > lines[i]) return i;
			return false;
		};
		for (var k in elements) {
			var e = elements[k], level = Can(e.left);
			if (e.width == 1) continue ;
			if (level) lines[level] = e.left + e.space;
			if (level === false) lines.push(e.left + e.space), level = lines.length;
			if (e.vis) visHeight = Math.max(visHeight, level * one + one + 3);
			elements[k].top = level * one;
		}
		return { el : elements, h : visHeight };
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
	window.onresize = function(e){
		$('#content').addClass('blur');
		Stack(function(){
			$('#content').removeClass('blur');
			ww = sel.offsetWidth;
			svg.setAttribute('viewBox', '0 0 '+ww+' 30');
			svg.setAttribute('width', ww);
			Parse(ww * H.bp[0] / size, ww * H.bp[1] / size);
			Rend();
		});
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
