<?php
class Requests extends PDO {
	function __construct() {
		header("Access-Control-Allow-Origin: *");
		
		$this->db = new PDO('mysql:host='.DBHOST.';port=3306;dbname='.DBNAME.';charset=UTF8', DBUSER, DBPASS);
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$this->method  = @$_SERVER['REQUEST_METHOD'];
		$this->request = @$_SERVER['REQUEST_URI'];
		
		# Get genes:
		$pattern = "/tea/app/([LMSX]+)/(chr[0-9XY]+)/([0-9]+)/([0-9]+)/?(.*)?";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			list($req, $mode, $chr, $start, $stop, $other) = $e;
			$mode = "_$mode";
			$start = (int) $start;
			$stop =  (int) $stop;
			if (method_exists($this, $mode)) {
				if ($stop - $start < 70000000) {
					$this->{$mode}($chr, (int) $start, (int) $stop);
				} else {
					echo "\n";
				}
				$this->BindLevels($chr, $start, $stop, $other);
			}
			exit;
		}

		# Get samples:
		$pattern = "/tea/app/data/([0-9A-z\-\_]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->_GetData($e[1]);
		}

		# Search:
		$pattern = "/tea/app/find/(.*)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->Find(urldecode(@$e[1]));
		}

		# Align:
		$pattern = "/tea/app/align/?";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->Align(@$_POST['seq']);
		}

		return die('false');
	}

	/**
	 * Shortcut: Query to the database
	 */
	public function Query($str, $data = []){
		$tmp = $this->db->prepare($str);
		$tmp->execute($data);
		return $tmp;
	}

	/**
	 * Shortcut: Query to the database (need result)
	 */
	public function FQuery($str, $data = []){
		return $this->Query($str, $data)->fetchAll(PDO::FETCH_ASSOC);
	}
	
	/**
	 * Genes searsh
	 */
	public function Find($str){
		$results = []; 
		$names = [];
		$query = $this->FQuery("
			select `knownGene`.`chrom`, `knownGene`.`txStart`, `knownGene`.`txEnd`, `knownToLynx`.`value`
			from `knownToLynx` left join `knownGene`
			on `knownToLynx`.`name` = `knownGene`.`name`
			where `knownToLynx`.`value` like ? limit 50", [$str . '%']);
		foreach ($query as $r) {
			if (in_array($r['value'], $names)) continue;
			$names[] = $r['value'];
			$point = number_format($r['txStart'] - 1500) . '-' . number_format($r['txEnd'] + 1500);
			$results[] = ['title' => "Gene: {$r['value']}", 'event' => "#{$r['chrom']}:$point"];
		}
		echo json_encode($results);
		exit;
	}
	
	/**
	 * Genes searsh
	 */
	public function Align($str){
		if (!preg_match("/^[A-z\[\,\]]+$/", $str)) die('false');
		exec("echo -e \">Name\n$str\" | blastn -db te.data -outfmt 5", $xml);
		$R = new SimpleXMLElement(implode("\n", $xml));
		$H = (array) @$R->BlastOutput_iterations->Iteration->Iteration_hits;
		if (!$H || count($H) == 0) die('0');
		echo json_encode($H['Hit']);
		exit;
	}
	
	/*
	 * Bind-levels:
	 */
	public function BindLevels($chr, $x1, $x2, $type){
		$step = 25;
		if ($x2 - $x1 > 40000 * 3) $step = 200;
		if ($x2 - $x1 > 100000 * 3) $step = 500;
		if ($x2 - $x1 > 400000 * 3) $step = 2000;
		if ($x2 - $x1 > 2000000 * 3) $step = 10000;
		if ($x2 - $x1 > 10000000 * 3) $step = 50000;

		$C = substr($chr, 3);
		if ($C == 'X') $C = 23;
		if ($C == 'Y') $C = 24;

		$types = [
			'H3k4me1' => "bind_4me1.{$C}",
			'H3k4me3' => "bind_4me3.{$C}",
			'H3k27ac' => "bind_27ac.{$C}"
		];
		$file = array_key_exists($type, $types) ? $types[$type] : "bind_27ac.{$C}";

		$l1 = round($x1 / (1000 * $step) - 1);
		$l2 = round($x2 / (1000 * $step) + 1);
		
		$T = array_map(function($t) use ($file, $step, $l1, $l2){
			$l1++;
			exec("sed -n {$l1},{$l2}p chipseq/{$file}.{$t}.{$step}.list", $exe);
			return (($l1 - 1) * 1000 * $step) . "|{$step}|" . implode(',', $exe);
		}, [0,1,2,3,4,5,6]);

		echo implode(";", $T), "\n";

		if ($x2 - $x1 < 10000) {
			$E = substr($chr, 3);
			exec("samtools faidx genome/Homo_sapiens.GRCh38.dna.chromosome.$E.fa $E:$x1-$x2", $seq);
			echo implode('', @array_slice($seq, 1));
		}
	}

	# Large [interval] = Transcripts inits (no repeats) by 32 base
	public function _L($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart` from `knownGene` 
			where `chrom` = ? and `txStart` > ? and `txStart` < ?
			group by `txStart` order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){ return base_convert($e['txStart'], 10, 32); }, $query);
		echo implode(";", $genes), "\n";
	}

	# Medium [interval] = Transcripts (start,length)
	public function _M($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd` from `knownGene` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init:$len";
		}, $query);
		echo implode(";", $genes), "\n";
	}

	# Small [interval] = Transcripts (name,protein,start,length)
	public function _S($chr, $start, $stop){
		$query = $this->FQuery("
			select `knownGene`.`txStart`, `knownGene`.`txEnd`, 
				`knownGene`.`cdsStart`, `knownGene`.`cdsEnd`,
				`knownGene`.`alignID`, `knownGene`.`strand`, `knownGene`.`proteinID`, `knownGene`.`exonStarts`, `knownGene`.`exonEnds`, `knownToLynx`.`value` from `knownGene` 
			left join `knownToLynx` on `knownGene`.`name` = `knownToLynx`.`name`
			where `knownGene`.`chrom` = ? and `knownGene`.`txStart` > ? and `knownGene`.`txEnd` < ?
			order by `knownGene`.`txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			$cinit = base_convert($e['cdsStart'], 10, 32);
			$clen  = base_convert($e['cdsEnd'] - $e['cdsStart'], 10, 32);
			return "$init:$len:$cinit:$clen:{$e['value']}:{$e['proteinID']}:{$e['strand']}";
		}, $query);
		echo implode(";", $genes), "\n";
	}

	# XSmall [interval] = Exons of genes
	public function _XS($chr, $x1, $x2){
		$start = $x1 - 15000;
		$stop  = $x2 + 15000;
		$query = $this->FQuery("
			select `knownGene`.`txStart`, `knownGene`.`txEnd`, 
				`knownGene`.`cdsStart`, `knownGene`.`cdsEnd`,
				`knownGene`.`alignID`, `knownGene`.`strand`, `knownGene`.`proteinID`, `knownGene`.`exonStarts`, `knownGene`.`exonEnds`, `knownToLynx`.`value` from `knownGene` 
			left join `knownToLynx` on `knownGene`.`name` = `knownToLynx`.`name`
			where `knownGene`.`chrom` = ? and 
				(`knownGene`.`txStart` > $start and `knownGene`.`txStart` < $stop or `knownGene`.`txEnd` > $start and `knownGene`.`txEnd` < $stop or `knownGene`.`txStart` < $start and `knownGene`.`txEnd` > $stop)
			order by `knownGene`.`txStart`", [$chr]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			$cinit = base_convert($e['cdsStart'], 10, 32);
			$clen  = base_convert($e['cdsEnd'] - $e['cdsStart'], 10, 32);
			if (!$e['value']) $e['value'] = $e['alignID'];
			return "$init:$len:$cinit:$clen:{$e['value']}:{$e['proteinID']}:{$e['strand']}:{$e['exonStarts']}:{$e['exonEnds']}";
		}, $query);
		echo implode(";", $genes), "\n";
	}
	# Load sample file
	public function _GetData($file){
		$name = "samples/$file";
		if (!file_exists($name)) die('false');
		echo file_get_contents($name);
	}

}
