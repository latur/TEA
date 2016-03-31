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
		Modal({'title' : 'Tree', 'data' : Template('tree'), 'class' : 'tree'});
		var tree = Tree();

        var newick = Newick.parse(tree)
        var newickNodes = []
        function buildNewickNodes(node, callback) {
          newickNodes.push(node)
          if (node.branchset) {
            for (var i=0; i < node.branchset.length; i++) {
              buildNewickNodes(node.branchset[i])
            }
          }
        }
        buildNewickNodes(newick)
        
		function ToDrawSvg(e, step, scale) {
			var child = e.children('.t-box');
			if (child.length == 2){
				var k = ($(child[0]).offset().top + $(child[0]).height());
				var v = k + $(child[1]).height()/2;
				$('#tree-svg').append(Scobe(k/2 + step * 6, v + step * 4, step * scale))
				ToDrawSvg($(child[0]), step + 1, scale);
				ToDrawSvg($(child[1]), step + 1, scale);
			}
		}
		
		function Scobe(p1, p2, x){
			var size = 20; x++;
			var ptss = [x+size+','+p1, x+','+p1, x+','+p2, x+size+','+p2].join(' ');
			var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
		    div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="black" points="'+ptss+'"></polyline></svg>';
		    var frag = document.createDocumentFragment();
		    while (div.firstChild.firstChild) frag.appendChild(div.firstChild.firstChild);
		    return frag;
		}
	

        d3.phylogram.buildRadial('#tree', newick, {
          width: 400,
          skipLabels: true
        })
        return;
        
        d3.phylogram.build('#tree', newick, {
          width: 800,
          height: 400
        });

	})

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




