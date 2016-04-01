$(function(){
	if (!Cookie.Get('clear')) {
		Msg.Show('Loading demo files..');
		Download(demo, function(){ Msg.Log('.') }, SamplesLoaded);
	} else {
		Route();
	}

	// Go to genome browser	
	$('.show-general').click(function(){ Route('#chr1:152967038-154678079'); });

	// Open Samples Library
	$('.library-open').click(function(e){
		Modal({
			'title' : 'Samples Library',
			'data'  : Template('library'),
			'class' : 'library'
		});
		// Loaded
		expNames.map(function(name){
			$('.library li.selected').removeClass('selected');
			$('[data-name="'+name+'"]').addClass('loaded');
		});
		// Check on/off
		$('.library li:not(.loaded)').click(function(){
			$(this)[$(this).hasClass('selected') ? 'removeClass' : 'addClass']('selected');
		});
		// Loading
		$('.get-samples').click(function(){
			$(this).addClass('disabled').html('Loading...')
			var samples = [];
			$('.library li.selected').each(function(){
				samples.push($(this).data('name'));
			});
			Download(samples, function(name){
				$('[data-name="'+name+'"]').addClass('loaded');
			}, function(){
				$('#modal').modal('hide');
				SamplesLoaded();
			});
		});
		// Close
		$('#modal').on('hide.bs.modal', function(){
			if (XHR) XHR.abort();
			if (expNames.length > 0) { }
		});
	});

	// Samples uploader
	$('.load-samples input').change(function(e){
		var fs = e.target.files;
		var ftotal = fs.length, itr = fs.length;
		if (ftotal > 0) Msg.Show('Loading files...');
		for (var i = 0; i < fs.length; i++) { 
			(function(f){
				var reader = new FileReader();
				reader.onload = function() {
					Parse(this.result, f.name); itr--;
					Msg.Update('Loading files: ' + i + '/' + ftotal);
					if (itr == 0) SamplesLoaded();
				};
				reader.readAsText(f);
			})(fs[i]);
		}
	});

	// Demo data
	$('.load-demo').click(function(e){
		Cookie.Set('clear', '');
		Msg.Show('Loading demo files...');
		Download(demo, function(){}, SamplesLoaded);
	});

	// Mode: General/Detail
	$('.v-mode .general').click(function(){ Route("#general"); });
	$('.v-mode .detail').click(function(){ Route('#detail'); });
	
	// Type	
	$('.visible.type a').click(function(e){
		var c = 'visible-type-' + $(this).data('id');
		$('body')[$('body').hasClass(c) ? 'removeClass' : 'addClass'](c);
	});
	// Compare
	$('.visible.mode .common').click(function(){
		$('body').removeClass('compare-differ');
		$('body').addClass('compare-common');
	});
	$('.visible.mode .differ').click(function(){
		$('body').removeClass('compare-common');
		$('body').addClass('compare-differ');
	});
	$('.visible.mode .all').click(function(){
		$('body').removeClass('compare-differ compare-common');
	});

	// Reset all
	$('.clear').click(function(){
		Cookie.Set('clear', 'true')
		location.hash = '';
		location.reload();
	});
	
	// Show Tree
	$('.showtree').click(function(){
		Modal({'title' : 'Phylogenetic Tree', 'data' : Template('tree'), 'class' : 'tree'});
		new Tree($('#tree'), $('#tree-svg'), $('#newick'));
	});
	
	// Group compare
	$('.comparision').click(function(){
		if (expGroup) {
			$('.comparision').removeClass('on');
			expGroup = false;
			cache = {};
			return Route();
		}
		
		var files = expNames.map(function(name){ return '<option>' + name + '</option>'; }).join('');
		Modal({'title' : 'Group compare', 'data' : Template('comparision', {files : files}), 'class' : 'compare'});
		var names = {g1 : [], g2 : []};
		var Parse = function(){
			names = {g1 : [], g2 : []};
			$('#group-1 option').each(function(){ names.g1.push($(this).html()); });
			$('#group-2 option').each(function(){ names.g2.push($(this).html()); });
			$('.g-compare').addClass('disabled');
			if (names.g1.length > 0 && names.g2.length > 0) $('.g-compare').removeClass('disabled');
		};

		$('.g-right').click(function(){
			$('#group-1 option:selected').each(function(){
				$('#group-2').append('<option>' + $(this).html() + '</option>');
			}).remove();
			Parse();
		});
		$('.g-left').click(function(){
			$('#group-2 option:selected').each(function(){
				$('#group-1').append('<option>' + $(this).html() + '</option>');
			}).remove();
			Parse();
		});
		$('.g-compare').click(function(){
			expGroup = {};
			for (var chr in expData){
				expGroup[chr] = { g1 : [], g2 : [] };
				names.g1.map(function(f){ expGroup[chr].g1 = expGroup[chr].g1.concat(expData[chr][f]); })
				names.g2.map(function(f){ expGroup[chr].g2 = expGroup[chr].g2.concat(expData[chr][f]); })
			}
			$('#modal').modal('hide');
			$('.comparision').addClass('on');
			cache = {};
			Route();
			console.log(expGroup);
		});
		
	});

	// Panel-fixed:
	$(window).scroll(function(e) {
		if ($('.fixed-nav').length == 0) return;
		if ($(this).scrollTop() > $('#header').height() + 20) {
			//$('body').addClass('fix');
			//doc.style.marginTop = $('.fixed-nav')[0].offsetHeight + 'px';
		} else {
			//$('body').removeClass('fix');
			//doc.style.marginTop = '0px';
		}
	});

	$("#find").keyup(function(e) {
   		if (e.keyCode == 13) {
		}
	});
});




