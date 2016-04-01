var Tree = (function(cnt, svg, txt){
	var dists = {};
	var items = [];
	var W = 45;
	
	function Pairs(A, B){
		var i = 0, j = 0, v = 0, pair = 0;
		while (i <= A.length && j <= B.length) {
			if (v == 0) while (A[i+1] && A[i+1] - A[i] <= B[j] - A[i]) i++;
			if (v == 1) while (B[j+1] && B[j+1] - B[j] <= A[i] - B[j]) j++;
			if (Math.abs(A[i] - B[j]) < 100) pair++;
			if (v == 0) i++;
			if (v == 1) j++;
			v = (v + 1) % 2;
		}
		return pair;
	}
	function Key(A, B) {
		return [A.name, B.name].sort().join('[+concat+]');
	}
	function R(num){
		return num !== undefined ? Math.round(num * 1000)/1000 : '';
	}
	function Distance(A, B){
		if (dists[Key(A, B)] === undefined) {
			var s = function(a, b) { return a - b; };
			var S1 = samples[A.name].sort(s);
			var S2 = samples[B.name].sort(s);
			var dist = 100 - (Pairs(S1, S2) + Pairs(S2, S1)) * 100 / (S1.length + S2.length);
			dists[Key(A, B)] = dist > 0 ? dist : 0;
		}
		return dists[Key(A, B)];
	}
	function Min(items){
		var i, j, mi = 1, mj = 0, d = Infinity;
		items.map(function(ei, i){
			items.map(function(ej, j){
				if (i <= j) return ;
				var dist = Distance(ei, ej);
				if (dist < d) d = dist, mi = i, mj = j;
			});
		});
		return {
			A : items[mi], 
			B : items[mj],
			Items : items.filter(function(e,k){ return k != mi && k != mj; })
		};
	}
	function Html(tree){
		if (!tree.data) return '<span>' + tree.name + '</span>';
		var txt = '';
		txt += '<div class="t-box">' + Html(tree.data[0]) + '<i>' + R((tree.data[0].dist || 0) - (tree.data[0].data ? tree.data[0].data[0].dist || 0 : 0)) + '</i>' + '</div>';
		txt += '<div class="t-box">' + Html(tree.data[1]) + '<i>' + R((tree.data[1].dist || 0) - (tree.data[1].data ? tree.data[0].data[1].dist || 0 : 0)) + '</i>' + '</div>';
		return txt;
	}
	function ToDrawSvg(e, step, scale, top) {
		var child = e.children('.t-box');
		if (child.length == 2){
			var k = (child[0].offsetTop + child[0].offsetHeight);
			var v = k + child[1].offsetHeight/2;
			svg.append(Scoba(k/2 + top, v + top, step * scale))
			ToDrawSvg($(child[0]), step + 1, scale, top);
			ToDrawSvg($(child[1]), step + 1, scale, top + child[0].offsetHeight);
		}
	}
	function Scoba(p1, p2, x){
		var size = W; x++;
		var ptss = [x+size+','+p1, x+','+p1, x+','+p2, x+size+','+p2].join(' ');
		var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
	    div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="black" points="'+ptss+'"></polyline></svg>';
	    var frag = document.createDocumentFragment();
	    while (div.firstChild.firstChild) frag.appendChild(div.firstChild.firstChild);
	    return frag;
	}
	function Newick(tree){
		if (!tree.data) return ['"' + tree.name + '"', tree.dist].join(':');
		var txt = Newick(tree.data[0]) + ', ' + Newick(tree.data[1]);
		var adaptiveDist = (tree.dist || 0) - (tree.data[0].dist || 0);
		return '('+ txt +'):' + (adaptiveDist > 0 ? adaptiveDist : 0);
	}
	function Rend(){
		var items = expNames.map(function(e){ return { name: e }; });
		console.log('GO');
		console.log(items);
		while (items.length > 1) {
			var m = Min(items);
			var dist = Distance(m.A, m.B)/2;
			m.A.dist = dist, m.B.dist = dist;
			var merged = { name : Key(m.A, m.B), data : [m.A, m.B] };
			items = m.Items.map(function(e){
				dists[Key(merged,e)] = Distance(e, m.A)/2 + Distance(e, m.A)/2;
				return e;
			});
			items.push(merged);
			console.log(items);
			console.log(dists);
		}
		newick = Newick(items[0]),
		cnt.html(Html(items[0]))
		svg.attr('height', expNames.length * 26);
		setTimeout(function(){ ToDrawSvg(cnt, 0, W, 0); }, 200);
		txt.val(newick)
	}
	Rend();
	//return { Newick : function(){ return newick; }};
});

/*
var samples = {};
for (var chr in expData) {
	for (var f in expData[chr]) {
		expData[chr][f].map(function(e){
			if (!samples[f]) samples[f] = [];
			samples[f].push(e[0]);
		});
	}
}
function DD(A,B){
  var s = function(a, b) { return a - b; };
  var S1 = samples[A].sort(s);
  var S2 = samples[B].sort(s);
  return (Pairs(S1, S2) + Pairs(S2, S1)) * 100 / (S1.length + S2.length);
}

DD("61", "61.2")
*/
