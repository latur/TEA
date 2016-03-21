$(function(){
	Route(); 

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
		if (ftotal > 0) MuteMessage('Loading files...');
		for (var i = 0; i < fs.length; i++) { 
			(function(f){
				var reader = new FileReader();
				reader.onload = function() {
					Parse(this.result, f.name); itr--;
					if (itr == 0) SamplesLoaded();
				};
				reader.readAsText(f);
			})(fs[i]);
		}
	});

	// Demo data
	$('.load-demo').click(function(e){
		MuteMessage('Loading demo files...');
		Download(['2ns-ready','2s-ready','2sready','SRR12','SRR16'], function(){}, SamplesLoaded);
	});

	// Mode: General/Detail
	$('.v-mode .general').click(function(){ Route("#general"); });
	$('.v-mode .detail').click(function(){ Route('#detail'); });
	
	// Type	
	$('.visible.type a').click(function(e){
		var c = 'visible-type-' + $(this).data('id');
		$('body')[$('body').hasClass(c) ? 'removeClass' : 'addClass'](c);
	});

	// Reset all
	$('.clear').click(function(){
		location.href = ''
	});

	// Panel-fixed:
	$(window).scroll(function(e) {
		if ($(this).scrollTop() > $('#header').height() + 10) {
			$('body').addClass('fix');
			doc.style.marginTop = $('.fixed-nav')[0].offsetHeight + 'px';
		} else {
			$('body').removeClass('fix');
			doc.style.marginTop = '0px';
		}
	});

	// Minimal screen width: 780px 
	// ... //

	$('.samples-nav-pane .comparision .txt').html(n_group == 0 ? 'Group comparision' : 'qwe');
	$('.samples-nav-pane .comparision').click(function(){
		if (n_group == 0){
			split_group();
		} else {
			delete_group();
		}
	});
	$('.samples-nav-pane .showtree').click(function(){
		Modal({ class : 'tree-dialog', data : '<div class="tree"></div>', title : 'Phylogenetic tree'})
		draw_tree();
	});
	$('.visible.mode a').click(function(){
		$('.visible.mode a').removeClass('selected')
		$(this).addClass('selected');
		visibleMode = $(this).data('map');
		general_map(visibleMode);
	});
	// Disable some function when number of file is lower than needed
	// if (n_file < 2) $('.samples-nav-pane .comparision').addClass("disabled");
	// if (n_file <= 2) $('.samples-nav-pane .showtree').addClass("disabled");


	$("#find").keyup(function(e) {
   		if (e.keyCode == 13) {
			var loc = $(this).val();
			if (loc) location.hash = loc + (expID ? ('/' + expID) : '');
			// Show one chromosome
			var chr = location.hash.match(/^\#?(chr[0-9XY]+)\:([0-9]+)\-([0-9]+)\/?([0-9a-z]+)?$/);
			if (chr) {
				return ShowChromosome(chr[1], parseInt(chr[2]), parseInt(chr[3]));
			} else {
				$(this).val('').attr("placeholder","Try again with search format. Ex: chr1:1000-5000000");
			}
		}
	});

	

});





