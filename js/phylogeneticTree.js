var Tree = (function(){
	var dists = {};
	var samples = {};
	var items = [];

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
		return [A.name, B.name].sort().join('.');
	}
	function Distance(A, B){
		if (!dists[Key(A, B)]) {
			var s = function(a, b) { return a - b; };
			var S1 = samples[A.name].sort(s);
			var S2 = samples[B.name].sort(s);
			dists[Key(A, B)] = (Pairs(S1, S2) + Pairs(S2, S1)) * 100 / (S1.length + S2.length);
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
	function Init(){
		for (var chr in expData) {
			for (var f in expData[chr]) {
				expData[chr][f].map(function(e){
					if (!samples[f]) samples[f] = [];
					samples[f].push(e[0]);
				});
			}
		}
		var items = expNames.map(function(e){ return { name: e }; });
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
			console.log(items)
		}
		
		return Newick(items[0]);
	}

	function Newick(tree){
		if (!tree.data) return ['"' + tree.name + '"', tree.dist].join(':');
		var txt = Newick(tree.data[0]) + ', ' + Newick(tree.data[1]);
		var adaptiveDist = (tree.dist || 0) - (tree.data[0].dist || 0);
		return '('+ txt +'):' + (adaptiveDist > 0 ? adaptiveDist : 0);
	}
	
	return Init;
}());

