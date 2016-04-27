var txt_color = {"A": "green", "C": "blue", "G": "#EEE61A", "T": "red", "_": "#6E6E6E"}
var mousedown = false, last_X = 0, last_left = 0, scroll = 0;
function draw_dash_line(x1, y1, x2, y2, w, canvas){
    	var dX = x2 - x1;
    	var dY = y2 - y1;
    	var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / 5);
    	var dashX = dX / dashes;
    	var dashY = dY / dashes;

	for (var q = 0; q < dashes; q += 2, x1 += 2*dashX, y1 += 2*dashY)
		draw_line(x1, y2, x1 + dashX, y1 + dashY, w, canvas)
}

function draw_line(x1, y1, x2, y2, w, canvas){
	canvas.moveTo(x1, y1);
	canvas.lineTo(x2, y2);
	canvas.lineWidth = w;
	canvas.stroke();
}

function draw_text(x, y, font, fill, content, canvas){
	canvas.font = font;
	canvas.fillStyle = fill;
	canvas.fillText(content, x, y);
}

function draw_polygon(x1, y1, x2, y2, x3, y3, w, canvas)
{
	canvas.beginPath();
	canvas.moveTo(x1, y1);
	canvas.lineTo(x2, y2);
	canvas.lineTo(x3, y3);
	canvas.closePath();
	canvas.stroke();
	canvas.fillStyle = "#6E6E6E";
	canvas.fill();
}

function complete(x){
	if (x == 'A') return 'T';
	else if (x == 'T') return 'A';
	else if (x == 'C') return 'G';
	else if (x == 'G') return 'C';
}

function draw_tsd(info){
	var canvas = document.getElementsByClassName("TSD")[0].getContext("2d");
	canvas.strokeStyle = "#6E6E6E"
	
	//Vertical line
	draw_line(389, 25, 389, 100, 1, canvas)
	draw_polygon(385, 100, 393, 100, 389, 110, 1, canvas);	

	// left tsd
	if (info[3] == "None"){
		draw_line(0, 45, 389, 45, 2, canvas)
		draw_line(0, 80, 389, 80, 2, canvas)
		draw_line(390, 80, 780, 80, 2, canvas)
		draw_line(390, 45, 780, 45, 2, canvas)
	} else if (info[3] == "Delete"){
		draw_dash_line(0, 45, 389, 45, 2, canvas);
		draw_dash_line(0, 80, 389, 80, 2, canvas);
		draw_line(390, 80, 780, 80, 2, canvas)
		draw_line(390, 45, 780, 45, 2, canvas)
		draw_text(15, 70,  "15px sans-serif", "red", "Deletion of " + info[4] + "bp", canvas);
	} else {
		draw_text(15, 70,  "15px sans-serif", "#000", "Target site duplication", canvas);
		var tsd = [info[3].replace(/]/g, "[").split("["), info[4].replace(/]/g, "[").split("[")]

		var str = [[],[]];
		for (var i in tsd){
			for (var k in tsd[i]){
				if (tsd[i][k].indexOf(",") == -1){
					var tmp = tsd[i][k].split('')
					for (var j in tmp)
						str[i].push(tmp[j])
				} else
					str[i].push(tsd[i][k])

			}
		}
		str[0].reverse()

		var l = [str[0].length, str[1].length];
		draw_line(0, 45, 389-l[0]*10, 45, 2, canvas)
		draw_line(390+l[1]*10, 80, 780, 80, 2, canvas)
		draw_line(0, 80, 389-l[0]*10, 80, 2, canvas)
		draw_line(390+l[1]*10, 45, 780, 45, 2, canvas)
		draw_dash_line(389-l[0]*10, 80, 389, 80, 2, canvas)
		draw_dash_line(390, 45, 390+l[1]*10, 45, 2, canvas)
		// Draw left
		var x = 389-l[0]*10
		for (var i in str[0]){
			if (str[0][i].length == 1){
				if (str[1][i].length == 1 && str[0][i] == str[1][i])
					draw_text(x, 45, "13px sans-serif", "#000", complete(str[0][i]), canvas)
				else if (str[1][i].length == 1 && str[0][i] != str[1][i])
					draw_text(x, 45, "13px sans-serif", txt_color[complete(str[0][i])], complete(str[0][i]), canvas)
				else if  (str[1][i].length > 1){
					var txt = str[1][i].split(",")
					var ok = 0;
					for (var k in txt){
						if (txt[k] == str[0][i]){
							draw_text(x, 45, "15px sans-serif", "#000", complete(str[0][i]), canvas)
							ok = 1;
							break;
						}
					}
					if (ok == 0)
						draw_text(x, 45, "13px sans-serif", txt_color[complete(str[0][i])], complete(str[0][i]), canvas)
				}

			} else {
				var tmp = str[0][i].split(",").sort(function(a,b){return a-b});
				var char = '';
				for (var k in tmp){
					if (str[1][i].length == 1 && tmp[k] == str[1][i]){
						char = tmp[k];
						break;
					} else if (str[1][i].length > 1){
						var t = str[1][i].split(",")
						for (var j in t){
							if (t[j] == tmp[k]){
								char = tmp[k];
								break;
							}
						}
						if (char != '') break;
					}
				}
				if (char != ''){
					draw_text(x, 45, "13px sans-serif", "#000", complete(char), canvas)
				} else {
					var y = 42;
					for (k in tmp){
						draw_text(x + 2, y, "10px sans-serif", txt_color[complete(tmp[k])], complete(tmp[k]), canvas)
						y += 12;
					}
				}
			}
			x += 10
		}

		// Draw right
		var x = 390;
		for (var i in str[1]){
			if (str[1][i].length == 1){
				if (str[0][i].length == 1 && str[1][i] == str[0][i])
					draw_text(x, 80, "13px sans-serif", "#000", str[1][i], canvas)
				else if (str[0][i].length == 1 && str[0][i] != str[1][i])
					draw_text(x, 80, "13px sans-serif", txt_color[str[1][i]], str[1][i], canvas)
				else if  (str[0][i].length > 1){
					var txt = str[0][i].split(",")
					var ok = 0;
					for (var k in txt){
						if (txt[k] == str[1][i]){
							draw_text(x, 80, "13px sans-serif", "#000", str[1][i], canvas)
							ok = 1;
							break;
						}
					}
					if (ok == 0)
						draw_text(x, 80, "13px sans-serif", txt_color[str[1][i]], str[1][i], canvas)
				}

			} else {
				var tmp = str[1][i].split(",").sort(function(a,b){return b>a});
				var char = '';
				for (var k in tmp){
					if (str[0][i].length == 1 && tmp[k] == str[0][i]){
						char = tmp[k];
						break;
					} else if (str[0][i].length > 1){
						var t = str[0][i].split(",")
						for (var j in t){
							if (t[j] == tmp[k]){
								char = tmp[k];
								break;
							}
						}
						if (char != '') break;
					}
				}
				if (char != ''){
					draw_text(x, 80, "13px sans-serif", "#000", char, canvas)
				} else {
					var y = 77;
					for (k in tmp){
						draw_text(x + 2, y, "10px sans-serif", txt_color[tmp[k]], tmp[k], canvas)
						y -= 12;
					}
				}
			}
			x += 10
		}

	}
}

function draw_ruler(canvas, len){
	draw_line(0, 10, len, 10, 1, canvas)

	for (var i = 100, k = 0; i < len - 100; i += 110, k += 10){
		draw_line(i, 10, i, 15, 1, canvas)
		draw_text(i, 8, "8px sans-serif", "#6E6E6E", k + " bp", canvas)
		if (i%1100 == 0)
			draw_line(i, 10, i, 20, 2, canvas)
	}
}

function draw_seq(info, ref, len){
	var canvas = document.getElementsByClassName("mini_browser")[0].getContext("2d");
	canvas.strokeStyle = "#6E6E6E";

	if (info[6] != "Unknown"){
		draw_ruler(canvas, len);
	}
	if (info[5] != "Unknown"){
		ref = ref.toUpperCase().split("");
		var start = ref.length, end = 0;

		var x = 100;
		for (var i = 0; i < ref.length; i++, x += 11)
			draw_text(x, 45, "15px sans-serif", "#6E6E6E", ref[i], canvas);

		var seq = info[6].split("/")
		for (var i = 0, y = 90; i < seq.length; i++){
			seq[i] = seq[i].split("");
			var r = align_seq(seq[i], ref);
			x = r.p*11 + 100;
			if (i > 0 && (r.p > end || r.p + r.s.length < start)) y -= 25;
			for (var k = 0, j = k + r.p; k < r.s.length && k < ref.length + r.p; k++, j++, x += 11){
				if (ref[j] == ".") break;
				if (r.s[k].indexOf('*') != -1){
					draw_text(x-5, y-15, "10px sans-serif", "#6E6E6E", r.s[k][0], canvas)
					x -= 11;
					--j;
				} else if (x >=100 && r.s[k] == ref[j]){
					draw_text(x, y, "15px sans-serif", "#000", r.s[k], canvas)
					if (j < start || j > end)
						draw_line(x+5.5, 53, x+5.5, y-17, 1, canvas)
				} else
					draw_text(x, y, "15px sans-serif", txt_color[r.s[k]], r.s[k], canvas)
			}
			if (r.p < start)
				start = r.p;
			if (r.p + r.s.length > end){
				end = r.p + r.s.length
			}
			 y += 25
		}
		last_left = -start*11 - 100;
		if (last_left > 0) last_left = 0;
		$(".mini_browser").css({"left": last_left + "px"});
	} else {
		if (info[6] == "Unknown")
			draw_text(355, 45, "15px sans-serif", "#6E6E6E", "(Unknown)", canvas);
		else {
			var x = 10;
			var seq = info[6].split("/");
			for (var i = 0; i < seq.length; i++){
				seq[i] = seq[i].split("");
				for (var k = 0; k < seq[i].length; k++){
					draw_text(x, 45, "15px sans-serif", "#6E6E6E", "N", canvas);
					draw_text(x, 90, "15px sans-serif", txt_color[seq[i][k]], seq[i][k], canvas)
					draw_line(x+5.5, 53, x+5.5, 90-17, 1, canvas)
					x += 11;
				}
				draw_text(x, 45, "15px sans-serif", "#6E6E6E", "N", canvas);
				x += 11;
			}
		}
	}
	
}

function align_contig(id){
	var id = id.split("-");
	var name = id[0], file = id[1], info = expData[name][file][id[2]];
	if (n_group > 0){
		Modal({
			title : '<b> Chromosome: </b>'+name.substr(3)+'<div class="tab"></div><b>Position: </b>'+info[0]+'<div class="tab"></div><b>Type: </b>'+info[5] + '<br><b>File name: </b>' + file,
			data  : '<pre>'+ info[4] +'</pre>',
		});
		return;
	}

	Modal({
		title : '<b> Chromosome: </b>'+name.substr(3)+'<div class="tab"></div><b>Position: </b>'+info[0]+'<div class="tab"></div><b>Type: </b>'+info[5] + '<br><b>File name: </b>' + file,
		data  : '<div id="detail"></div>',
		class : 'contig_align'
	});
	$("#detail").append("<canvas class='TSD' width='780' height='120'><canvas/>");
	draw_tsd(info);
	
	$("#detail")
		.append("<div class='mini_wrap'><div/>")

	var len = 0, height = 0, ref = '';
	if (info[5] != "Unknown"){
		if (TE_ref[info[5]].length > 1000){
			ref = TE_ref[info[5]].substr(0, 500) + "..." + TE_ref[info[5]].substr(-500, 500);
		} else
			ref = TE_ref[info[5]];

		len = ref.length*11 + 200;
		if (info[6] != "Unknown")
			height = info[6].split("/").length*25 + 90;
		else
			height = 90;
	} else if (info[6] != "Unknown"){
		var seq = info[6].split("/");
		height = seq.length*25 + 90
		len = 10;
		for (var i = 0; i < seq.length; i++)
			len += seq[i].length*11;
	} else {
		height = 90;
		len = 780;
	}

	$(".mini_wrap").append(function(){
			return $("<canvas/>")
				.attr("width",  len)
				.attr("height", height)
				.attr("class", "mini_browser")
	});
	draw_seq(info, ref, len);

	if (info[6] != "Unknown")
		$(".mini_wrap")
			.append("<div class='title'>Reference</div>")
			.append("<div class='title' style='top: 50px'>Contigs</div>")

	$('.mini_browser')
		.mousedown(function(e) {
			last_X = e.pageX;
			mousedown = true;
		})
		.mousemove(function(e) {
			if (!mousedown) {
				return;
			}

			var distance = e.pageX-last_X;
			last_left += distance;
			if (last_left > 0) last_left = 0;
			if (last_left < -(this.width - 780)) last_left = -(this.width - 780);
			this.style.left = last_left + 'px';
			last_X = e.pageX;
		})
		.mouseup(function(e) {
			if (!mousedown) {
				return;
			}
			mousedown = false;
		});
		
}

function align_seq(s1, s2){
	var r = {"s": []};
	var m = 0;
	var x, y;
	var Matrix = []
	var l1 = s1.length;
	var l2 = s2.length;
	for (var a=0; a<= l1; a++) Matrix.push([0])
	for (var a=1; a<= l2; a++) Matrix[0].push(0)
 
	for (var a=1; a<= l1; a++){
	 for (var b=1; b<= l2; b++){
		var score = -1;
		if (s1[a-1] == s2[b-1]) score = 4;
		Matrix[a][b] = Math.max(0, Matrix[a][b-1] - 2, Matrix[a-1][b] - 2, Matrix[a-1][b-1] + score)
		if (Matrix[a][b] > m){
			m = Matrix[a][b];
			x = a;
			y = b;
		}
	 }
	}

	l2 = y;
	while (l1 > x){
		--l1;
		r["s"].push(s1[l1-1]);		
	}

	var start = false;
	while (l1 > 0 && l2 > 0){
		var score = -1;
		if (s1[l1-1] == s2[l2-1]) score = 4;
		if (Matrix[l1][l2] == Matrix[l1-1][l2-1] + score){
			start = true;
			r["s"].push(s1[l1-1]);
			--l1;
			--l2;
		} else if (Matrix[l1][l2] == Matrix[l1-1][l2] - 2){
			r["s"].push(s1[l1-1] + "*");
			--l1;
		} else {
			if (start)
				r["s"].push("_")
			--l2;
		}
	}

	while (l1 > 0){
			r["s"].push(s1[l1-1]);
			--l1;
			--l2;
	}

	while (r["s"][0] == '_') r["s"].shift();
	r["s"].reverse();

	while (r["s"][0] == '_'){
		r["s"].shift();
		++l2;
	}
	r["p"] = l2;

	return r;
}
