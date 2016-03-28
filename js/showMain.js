// Mouse actions: select a chromosome
function _ShowHelper(){
	var offset = 5000000;
	var hovrline = $('#hovrline')[0];
	$('.chr-box').hover(function(){
		if (hovrline) hovrline.style.display = 'block';
	}, function(){
		if (hovrline) hovrline.style.display = 'none';
	}).each(function(){
		var e = $(this)[0], name = $(this).data('name');
		var K = chrs[name]/$(this).width();
		$(this).mousemove(function(h){
			e.children[0].style.left = h.offsetX + 'px';
			var pt = parseInt(h.offsetX * K);
			var start = pt - offset < 0 ? 0 : pt - offset;
			var stop  = pt + offset > chrs[name] ? chrs[name] : pt + offset;
			e.children[0].innerHTML = name + ":" + start + "-" + stop;
			if (hovrline) hovrline.style.left = h.pageX - 20 + 'px';
		}).click(function(){
			var loc = $(this).children('.helper').html();
			Route(loc);
		});
	});
}
// Add samples pane, hide initial pane
function _HideIntro(){
	$('.mini-controls').remove();
	$('.intro').addClass('pad').removeClass('intro');
	$('.extended-controls').fadeIn();
	$('.v-mode a').removeClass('disabled');
}

// Showing chromosomes in two vertical list
function ShowDetail(){
	_HideIntro();
	$('.v-mode .detail').addClass('disabled');
	var clist = Object.keys(chrs).map(function(name, i){
		return Template('chr', {
			title: name,
			name: name + '-full',
			style : '',
			width: chrs[name] * 100 / chrs.chr1,
			i: i
		});
	}).join('');
	var samples = expNames.map(function(f){
		return '<div class="fn"><span>' + f + '</span></div>';
	}).join('');
	
	doc.innerHTML = Template('chr-list', {clist : clist});
	// Heatmap of samples
	Object.keys(expData).map(function(chr){
		HeatMap(chr, 12, samples);
	});
	_ShowHelper();
}

// Showing chromosomes as one line
function ShowGeneral(){
	_HideIntro();
	$('.v-mode .general').addClass('disabled');
	doc.innerHTML = Template('chr-line');
	Object.keys(chrs).map(function(name, i){
		var style = 'width:' + (chrs[name] * 100 / chrsSum - 0.15) + '%'; // 0.15 is margin
		var title = i > 10 ? name.substr(3) : name;
		var chr = { title: title, name: name, style : style, width: 100, i: i };
		$('.chr-line').append( Template('chr', chr) )
	});
	_ShowHelper();
	Object.keys(expData).map(function(chr){
		HeatMap(chr, 36, "");
	}); // Heatmap of samples
	// Sample-names:
	$('.chr-line-names').html(expNames.map(function(f){
		return '<div class="fn"><span>' + f + '</span></div>';
	}).join(''));
}
