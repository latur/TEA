function show_TE(id, checked){
	if (checked)
		$("."+id).css("visibility", "visible");
	else		
		$("."+id).css("visibility", "hidden");
}

/* Draw map */

function calculate_ratio(mode, name, chr, pos, type){
	if (mode == 0)
		return density_map[chr][name][pos][type]/d_max;
	else if (mode == 1)
		return density_map[chr][name][pos][type+3]/d_max;
	else 
		return (density_map[chr][name][pos][type]-density_map[chr][name][pos][type+3])/d_max;
}

function get_check(mode){
	$("[name=Compare]").prop("checked", false);
	if (mode == 0)
	    	$("#All").prop("checked", true);
	else if (mode == 1)
	    	$("#Common").prop("checked", true);
	else 
		$("#Diff").prop("checked", true);

}

function general_map(mode){
	get_check(mode);
	$('.visible.type a').addClass('selected');
	visibleType['1'] = visibleType['2'] = visibleType['3'] = true;

	var w= $("#chrsline").width();
	var map = d3.select("#g_map")
		.html('')
		.attr("width", w)
		.attr("height", file_list.length*80);

	var step = w*1000000/chrsSum;
	for (var i = 0; i < n_file; i++){
		var name = file_list[i];
		var x = 0;
		var y = i*80 + 20;
		map.append("text")
			.attr("x", 5)
			.attr("y", y)
			.attr("class", "map_name")
			.attr("id", name)
			.on("click", function(){
				remove_file(this.id);
			})
			.on("mouseover", function(){
				$("body").append(function(){
					return $("<div/>")
						.attr("class", "pop_up")
						.attr("style", "height: 25px; font-size: 15px; text-align: center;padding: 5px; border-radius: 3px;")
						.css("left", event.clientX + 10)
						.css("top", event.clientY + 10)
						.append(function(){
							return $("<span/>").attr("class", "glyphicon glyphicon-trash");
						});
					});
			})
			.on("mouseout", function(){
				$(".pop_up").remove();
			})
			.text(name);
		y += 20;
		for (var k in density_map){
			if (k.localeCompare("map") == 0 || !density_map[k][name]){
				x += step*density_len[k];
			 	continue;
			}

			for (var j = 0; j < density_len[k]; j++, x += step){
				for (var t = 0; t < 3; t++){
					if (mode == 0 && density_map[k][name][j][t] == 0) continue;
					if (mode == 1 && density_map[k][name][j][t+3] == 0) continue;
					if (mode == 2 && density_map[k][name][j][t] <= density_map[k][name][j][t+3]) continue;
					var ratio = calculate_ratio(mode, name, k, j, t);

					map.append("line")
					 	.attr("x1", x)
						.attr("y1", y - 30*ratio)
						.attr("x2", x)
						.attr("y2", y + 30*ratio)
						.attr("class", TE_type[t])
						.attr("style", "stroke:" + color[t] + "; cursor: pointer")
						.attr("opacity", ratio*5)
						.attr("id", Math.ceil(ratio*d_max) + " 	sites")
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
				}
			}
		}

	}
}

/* Data modified */

/* -------------------------------------------- */

function get_max(){
	d_max = 0;

	for (var chr in density_map){
		if (chr.localeCompare("map") == 0) continue;

		for (var name in density_map[chr]){
			if (chr.localeCompare("map") == 0) continue;

			for (var j = 0; j < density_len[chr]; j++){
				var sum = density_map[chr][name][j][0] + density_map[chr][name][j][1] + density_map[chr][name][j][2];
				if (sum > d_max) d_max = sum;
			}
		}
	}
}

function get_idlist(){
	id_list = {};
	for (var chr in expData){
		if (chr.localeCompare("map") == 0) continue;

		for (var name in expData[chr]){
			if (name.localeCompare("map") == 0) continue;

			for (var pos = 0; pos < expData[chr][name].length; pos++)
				id_list[expData[chr][name][pos][5]] = 0;
		}
	}	
}

function remove_file(id){
	for (var chr in expData){
		if (chr.localeCompare("map") == 0) continue;
		if (expData[chr][id]){
			delete expData[chr][id];
			delete chr[id];
		}
	}

	for (var i = 0; i < n_file; i++){
		if (file_list[i].localeCompare(id) == 0){
			file_list.splice(i, 1);
			break;
		}
	}

	--n_file;
	get_max();
	get_idlist();
	if (n_file > 1)
		get_common();
	if (n_file > 2)
		contruct_tree();

	SamplesLoaded();
	general_map(0);
}

/* Calculate common differenet & tree */
function add_common(chr, pos, type, id){
	var cell = Math.ceil(pos/1000000)-1;
	if (cell >= density_len[chr]) cell = density_len[chr]-1;

	for (var name in density_map[chr]){
		if (name.localeCompare("map") == 0 ) continue;
		++density_map[chr][name][cell][type+3];
	}

	for (var i = 0; i < id.length; i++)
		id_list[id[i]] = 1;
}

function init(){
	for (var id in id_list){
		if (id.localeCompare("map") == 0) continue;
		 id_list[id] = 0;
	}

	for (var chr in density_map){
		if (chr.localeCompare("map") == 0) continue;

		for (var name in density_map[chr]){
			if (name.localeCompare("map") == 0) continue;

			for (var pos = 0; pos < density_map[chr][name].length; pos++)
				density_map[chr][name][pos][3] = density_map[chr][name][pos][4] = density_map[chr][name][pos][5] = 0;
		}
	}
}

function get_common(){
	init();

	var name = file_list[0];

	for (var chr in expData){
		if (chr.localeCompare("map") == 0 || !expData[chr][name]) continue;

		for (var pos = 0; pos < expData[chr][name].length; pos++){
			var id = [expData[chr][name][pos][5]];
			var count = 0;
			for (var i = 1; i < n_file; i++){
				var n = file_list[i];
				if (!expData[chr][n]) break;

				for (var k = 0; k < expData[chr][n].length; k++){
					if (Math.abs(expData[chr][name][pos][0] - expData[chr][n][k][0]) < 100 &&
							expData[chr][name][pos][2] == expData[chr][n][k][2]){
						id.push(expData[chr][n][k][0][5]);
						++count;
						break;
					}
/*					if (expData[chr][n][k][0] - expData[chr][name][pos][0] > 100)
						break;*/
				}
				if (count < i) break;
			}
			if (count == n_file - 1)
				add_common(chr, expData[chr][name][pos][0], expData[chr][name][pos][2]-1, id);
		};
	};
}
