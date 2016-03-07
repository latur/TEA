
/* Draw tree */
function contruct_tree(){
	var dis_matrix = [];
	for (var i = 0; i < (n_file-1); i += 1){
		var name = file_list[i];
		dis_matrix.push([]);
		for (var k = i+1; k < n_file; k += 1){
			var n = file_list[k];
			var pair = 0, total = 0;
			for (var chr in expData[name]){
				if (chr.localeCompare("map") == 0) continue;
				total += expData[name][chr].length ;

				if (!expData[n].hasOwnProperty(chr)) continue;
				total += expData[name][chr].length;

				for (var p1 = 0; p1 < expData[name][chr].length; p1++){
					for (var p2 = 0; p2 < expData[n][chr].length; p2++){
						if (Math.abs(expData[name][chr][p1].pos - expData[n][chr][p2].pos) < 100 &&
							expData[name][chr][p1].type == expData[n][chr][p2].type){
								pair += 1;
							break;
						}
					}

				}
			}
			var score =Math.round((total - 2*pair)*100/(total-pair));
			dis_matrix[i].push({f1: i, f2: k, dis: score});
		}
	}

	tree = [], last = n_file-1;
	while (dis_matrix.length > 1){
		var min_x = 0, min_y = 0, min_val = dis_matrix[0][0].dis;
		for (var i = 0; i < dis_matrix.length; i += 1){
			for (var k = 0; k < dis_matrix[i].length; k += 1){
				if (dis_matrix[i][k].dis < min_val){
					min_x = i;
					min_y = k;
					min_val = dis_matrix[i][k].dis;
				}
			}
		}

		var f1 = dis_matrix[min_x][min_y].f1, f2 = dis_matrix[min_x][min_y].f2;
		tree.push({name: f1 +'-'+ f2, dis: min_val});
		var l_score = 0, mate = 0;
		if (last != f1 && last != f2){
			for (var a = 0; a < dis_matrix.length; a += 1){
				for (var b = 0; b < dis_matrix[a].length; b += 1){
					if ((dis_matrix[a][b].f1 == last || dis_matrix[a][b].f2 == last) &&
						(dis_matrix[a][b].f1 == f1 || dis_matrix[a][b].f1 == f2 ||
						dis_matrix[a][b].f2 == f1 || dis_matrix[a][b].f2 == f2)){
						l_score += dis_matrix[a][b].dis;
						mate += 1;
					}
					if (mate == 2) break;
				}
				if (mate == 2) break;
			}
		}

		for (var i = 0; i < dis_matrix.length; i += 1){
			if (i == min_x || i == (min_x + min_y + 1))
				continue;
			var score = 0, mate = 0, f0 = dis_matrix[i][0].f1;
			for (var a = 0; a < dis_matrix.length; a += 1){
				for (var b = 0; b < dis_matrix[a].length; b += 1){
					if ((dis_matrix[a][b].f1 == f0 || dis_matrix[a][b].f2 == f0) &&
						(dis_matrix[a][b].f1 == f1 || dis_matrix[a][b].f1 == f2 ||
						dis_matrix[a][b].f2 == f1 || dis_matrix[a][b].f2 == f2)){
						score += dis_matrix[a][b].dis;
						mate += 1;
						dis_matrix[a].splice(b, 1);
						b -= 1;
					}

					if (mate == 2) break;
				}
				if (mate == 2) break;
			}
			dis_matrix[i].push({f1: f0, f2: f1+'/'+f2, dis: Math.round(score/2)});
		}
		dis_matrix.splice(min_x, 1);
		dis_matrix.splice(min_x + min_y, 1);
		if (last != f1 && last != f2)
			dis_matrix.push([{f1: last, f2: f1+'/'+f2, dis: Math.round(l_score/2)}]);
		last = f1 +'/'+ f2;
	}
	tree.push({name: dis_matrix[0][0].f1 +'-'+dis_matrix[0][0].f2, dis: dis_matrix[0][0].dis});
}

function draw_tree(){
	$("body")
		.append(function(){
			return $("<div/>").attr("class", "screen_blur");
		})
		.append(function(){
			return $("<div/>")
				.attr("class", "tree")
		});

	$(document).keyup(function(e) {
   		if (e.keyCode == 27) { 
			$(".screen_blur").remove();
			$(".tree").remove();
    		}
	});

	var circos = d3.select(".tree").append("svg")	
			.attr("width", 650)
			.attr("height", 650)
			.attr("style", "position: relative; display: block; margin: auto;cursor: move");

	var order = tree[tree.length-1].name.replace("\-", "\/").split("\/");

	var unit = 2*Math.PI/n_file, r = 260, w = 650/2; max_len = tree[tree.length-1].dis;

	for (var i = 0; i < tree.length; i += 1){
		var node = tree[i].name.split("\-");
		var coord = [];
		var len = tree[i].dis*r/max_len;
		var angle = 0;
		for (var a = 0; a < 2; a += 1){
			var itr = 0;
			var name = node[a].split("\/");
			if (name.length == 1){
				while (order[itr] != node[a]) itr += 1;
				angle += itr*unit+Math.PI/2;
				var dx = w + Math.cos(itr*unit+Math.PI/2)*(r-len);
				var dy = w - Math.sin(itr*unit+Math.PI/2)*(r-len);

				circos.append("line")
					.attr("x1", w + Math.cos(itr*unit+Math.PI/2)*(r))
					.attr("y1", w - Math.sin(itr*unit+Math.PI/2)*(r))
					.attr("x2", dx)
					.attr("y2", dy)
					.attr("style", "stroke: black; stroke-width: 3px; cursor: pointer;")
					.attr("id", (len/r).toPrecision(2))
					.on("mouseover", function(){
						var id = this.id;
						$("body").append(function(){
							return $("<div/>")
								.attr("class", "pop_up")
								.attr("style", "height: 20px; font-size: 12px; text-align: center;")
								.css("left", event.clientX + 10)
								.css("top", event.clientY + 10)
								.html(id);
						});
					})
					.on("mouseout", function(){
						$(".pop_up").remove();
					});
				coord.push([dx, dy]);
			} else {
				while (tree[itr].name.replace("\-","\/") != node[a]) itr += 1;
				angle += tree[itr].angle;
				var dx = w + Math.cos(tree[itr].angle)*(r-len);
				var dy = w - Math.sin(tree[itr].angle)*(r-len);
				circos.append("line")
					.attr("x1", tree[itr].coord[0])
					.attr("y1", tree[itr].coord[1])
					.attr("x2", dx)
					.attr("y2", dy)
					.attr("style", "stroke: black; stroke-width: 3px; cursor: pointer;")
					.attr("id", (len/r).toPrecision(2))
					.on("mouseover", function(){
						var id = this.id;
						$("body").append(function(){
							return $("<div/>")
								.attr("class", "pop_up")
								.attr("style", "height: 20px; font-size: 12px; text-align: center;")
								.css("left", event.clientX + 10)
								.css("top", event.clientY + 10)
								.html(id);
						});
					})
					.on("mouseout", function(){
						$(".pop_up").remove();
					});
				coord.push([dx, dy]);
			}
		}
		circos.append("path")
			.attr("d", function(){
				var path = "M" + coord[0][0] + "," + coord[0][1];
				path += " A" + (r-len) + "," + (r-len) + " 0 0,0 " + coord[1][0] + "," + coord[1][1];
				return path;
			})
			.style("stroke", "black")
			.attr("fill", "none");
		tree[i].coord = [w + Math.cos(angle/2)*(r-len), w - Math.sin(angle/2)*(r-len)];
		tree[i].angle = angle/2;
	}

	circos.append("circle")
		.attr("cx", w)
		.attr("cy", w)
		.attr("r", 2)
		.attr("stroke", "black")
		.attr("fill", "black");
	for (var i = 0; i < n_file; i += 1){
		circos.append("circle")
			.attr("cx", w + Math.cos(i*unit+Math.PI/2)*r)
			.attr("cy", w - Math.sin(i*unit+Math.PI/2)*r)
			.attr("r", 2)
			.attr("stroke", "black")
			.attr("fill", "black");
		var dx = w + Math.cos(i*unit+Math.PI/2)*(r+10);
		var dy = w - Math.sin(i*unit+Math.PI/2)*(r+10);
		circos.append("text")
			.attr("style", "font-size: 8px")
			.attr("text-anchor", "start")
      			.attr("transform", "translate("+dx+","+dy+")rotate("+(-(360*i/n_file + 90))+")")
			.text(file_list[Number(order[i])]);
	}	
//	var elem=document.getElementById("tree_circos");
//	var dial=kcRotateDial(elem);
}
