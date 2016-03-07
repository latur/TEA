function show_TE(id, checked){
	if (checked)
		$("."+id).css("visibility", "visible");
	else		
		$("."+id).css("visibility", "hidden");
}

/* Draw map */

function calculate_ratio(mode, name, chr, pos, type){
	if (mode == 0)
		return density_map[name][chr][pos][type]/d_max;
	else if (mode == 1)
		return density_map[name][chr][pos][type+3]/d_max;
	else 
		return (density_map[name][chr][pos][type]-density_map[name][chr][pos][type+3])/d_max;
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
	var map = d3.select("#g_map")
		.html('')
		.attr("height", file_list.length*80);

	var step = 1030*1000000/chr_total;
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
			.text(name);
		y += 20;
		for (var k in density_map[name]){
			if (k.localeCompare("map") == 0) continue;
			for (var j = 0; j < density_len[k]; j++, x += step){
				for (var t = 0; t < 3; t++){
					if (density_map[name][k][j][t] == 0) continue;
					var ratio = calculate_ratio(mode, name, k, j, t);

					map.append("line")
					 	.attr("x1", x)
						.attr("y1", y - 30*ratio)
						.attr("x2", x)
						.attr("y2", y + 30*ratio)
						.attr("class", TE_type[t])
						.attr("style", "stroke:" + color[t] + ";stroke-width: 0.5px; cursor: pointer")
						.attr("opacity", ratio*3)
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
			x += 5;
		}

	}
}

/* Data modified */

function get_max(){
	d_max = 0;
	for (var i = 0; i < n_file; i++){
		var name = file_list[i];
		for (var k in density_map[name]){
			if (k.localeCompare("map") == 0) continue;
			for (var j = 0; j < density_len[k]; j++){
				var sum = density_map[name][k][j][0] + density_map[name][k][j][1] + density_map[name][k][j][2];
				if (sum > d_max) d_max = sum;
			}
		}
	}
}

function get_idlist(){
	id_list = {};
	for (var name in expDataUp){
		if (name.localeCompare("map") == 0) continue;

		for (var chr in expDataUp[name]){
			if (chr.localeCompare("map") == 0) continue;

			for (var pos = 0; pos < density_map[name][chr].length; pos++)
				id_list[density_map[name][chr][pos].id] = 0;
		}
	}	
}

function remove_file(id){
	delete expDataUp[id];
	delete density_map[id];
	for (var i = 0; i < n_file; i++){
		if (file_list[i].localeCompare(id) == 0){
			file_list.splice(i, 1);
			break;
		}
	}
	--n_file;
	get_max();
	get_idlist();
	get_common();
	contruct_tree();
	general_map(0);
}

/* Calculate common differenet & tree */
function add_common(chr, pos, type, id){
	var cell = Math.ceil(pos/1000000)-1;
	if (cell >= density_len[chr]) cell = density_len[chr]-1;

	for (var name in density_map){
		if (name.localeCompare("map") == 0) continue;
		++density_map[name][chr][cell][type+3];
	}

	for (var i = 0; i < id.length; i++)
		id_list[id[i]] = 1;
}

function init(){
	for (var id in id_list){
		if (id.localeCompare("map") == 0) continue;
		 id_list[id] = 0;
	}

	for (var name in density_map){
		if (name.localeCompare("map") == 0) continue;

		for (var chr in density_map[name]){
			if (chr.localeCompare("map") == 0) continue;

			for (var pos = 0; pos < density_map[name][chr].length; pos++)
				density_map[name][chr][pos][3] = density_map[name][chr][pos][4] = density_map[name][chr][pos][5] = 0;
		}
	}
}

function get_common(){
	init();

	var name = file_list[0];

	for (var chr in expDataUp[name]){
		if (chr.localeCompare("map") == 0) continue;
		for (var pos = 0; pos < expDataUp[name][chr].length; pos++){
			var count = 0;
			var id = [expDataUp[name][chr][pos].id];
			for (var i = 1; i < n_file; i++){
				var n = file_list[i];
				if (!expDataUp[n].hasOwnProperty(chr)) continue;

				for (var k = 0; k < expDataUp[n][chr].length; k++){
					if (Math.abs(expDataUp[name][chr][pos].pos - expDataUp[n][chr][k].pos) < 100 &&
						expDataUp[name][chr][pos].type == expDataUp[n][chr][k].type){
						id.push(expDataUp[n][chr][k].id);
						++count;
						break;
					}
					if (expDataUp[n][chr][k].pos - expDataUp[name][chr][pos].pos > 100)
						break;
				}
				if (count < i) break;
			}
			if (count == n_file - 1)
				add_common(chr, expDataUp[name][chr][pos].pos, expDataUp[name][chr][pos].type, id);
		}
	}
}