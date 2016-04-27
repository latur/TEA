<?php
class Requests extends PDO {
	function __construct() {
		header("Access-Control-Allow-Origin: *");
		
		$this->db = new PDO('mysql:host='.DBHOST.';port=3306;dbname='.DBNAME.';charset=UTF8', DBUSER, DBPASS);
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$this->method  = @$_SERVER['REQUEST_METHOD'];
		$this->request = @$_SERVER['REQUEST_URI'];
		#sleep(1);
		
		# Get genes:
		$pattern = "/tea/app/([LMSX]+)/(chr[0-9XY]+)/([0-9]+)/([0-9]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			list($req, $mode, $chr, $start, $stop) = $e;
			$mode = "_$mode";
			$start = (int) $start;
			$stop =  (int) $stop;
			if (method_exists($this, $mode)) {
				if ($stop - $start < 70000000) {
					$this->{$mode}($chr, (int) $start, (int) $stop);
				} else {
					echo "\n";
				}
				$this->BindLevels($chr, $start, $stop);
			}
			exit;
		}

		# Get samples (old version):
		$pattern = "/tea/app/sample/([0-9A-z\-\_]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->_GetSample($e[1]);
		}

		$pattern = "/tea/app/data/([0-9A-z\-\_]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->_GetData($e[1]);
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
	
	/*
	 * Bind-levels:
	 */
	public function BindLevels($chr, $x1, $x2){

		$step = 25;
		if ($x2 - $x1 > 500000)  $step = 1000;
		if ($x2 - $x1 > 5000000) $step = 50000;

		$query = $this->FQuery("select `type`,`start`,`data` from `rnaseq{$step}x` 
			where `chr` = ? AND (`start` >= ? and `start` <= ?)", 
			[substr($chr, 3), $x1 - $step * 1000, $x2 + $step * 1000]);
		$T = [0, 0, 0, 0, 0, 0];
		foreach ($query as $e) {
			if ($T[$e['type']] == 0) {
				$init = $e['start'] - 25 * 2050;
				$T[$e['type']] = "{$init}|{$step}|{$e['data']}";
			} else {
				$T[$e['type']] .= ",{$e['data']}";
			}
		}
		echo implode(";", $T);

		if ($x2 - $x1 < 10000) {
			$E = substr($chr, 3);
			exec("samtools faidx genome/Homo_sapiens.GRCh38.dna.chromosome.$E.fa $E:$x1-$x2", $seq);
			echo "\n", implode('', @array_slice($seq, 1));
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
		# print_r($query);
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
	public function _GetSample($file){
		$name = "samples.csv/$file.csv";
		if (!file_exists($name)) die('false');
		echo file_get_contents($name);
	}
	# Load sample file
	public function _GetData($file){
		$name = "samples/$file";
		if (!file_exists($name)) die('false');
		echo file_get_contents($name);
	}

}
