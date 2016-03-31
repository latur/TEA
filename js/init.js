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





