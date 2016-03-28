<?php
class Requests extends PDO {
	function __construct() {
		header("Access-Control-Allow-Origin: *");
		
		$this->db = new PDO('mysql:host='.DBHOST.';port=3306;dbname='.DBNAME.';charset=UTF8', DBUSER, DBPASS);
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$this->method  = @$_SERVER['REQUEST_METHOD'];
		$this->request = @$_SERVER['REQUEST_URI'];
		
		# Get genes:
		$pattern = "/tea/app/([LMSX]+)/(chr[0-9XY]+)/([0-9]+)/([0-9]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			list($req, $mode, $chr, $start, $stop) = $e;
			$mode = "_$mode";
			if (method_exists($this, $mode)) $this->{$mode}($chr, $start, $stop);
		}

		# Get samples:
		$pattern = "/tea/app/sample/([0-9A-z\-\_]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			$this->_GetSample($e[1]);
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
		$step = 100;
		if ($x2 - $x1 > 800000)   $step = 1000;
		if ($x2 - $x1 > 8000000)  $step = 10000;
		if ($x2 - $x1 > 80000000) $step = 100000;
		# =] 			3882699
		$query = $this->FQuery("select `type`,`start`,`data` from `bindx{$step}` 
			where `chr` = ? AND (`start` > ? and `start` < ?)", [substr($chr, 3), $x1 - $step * 1000 - 1000, $x2 + $step * 1000 + 1000]);
		$T = [0,0,0,0,0,0];
		foreach ($query as $e) {
			if ($T[$e['type']] == 0) {
				$init = $e['start'] + 28550 - $step * 10; # ¯\_(ツ)_/¯
				$T[$e['type']] = "{$init}:{$step}:{$e['data']}";
			} else {
				$T[$e['type']] .= ",{$e['data']}";
			}
		}
		echo implode(";", $T);
	}
	

	# Large [interval] = Transcripts inits (no repeats) by 32 base
	public function _L($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart` from `genes` 
			where `chrom` = ? and `txStart` > ? and `txStart` < ?
			group by `txStart` order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){ return base_convert($e['txStart'], 10, 32); }, $query);
		echo implode(";", $genes), "\n";
		$this->BindLevels($chr, $start, $stop);
		exit;
	}

	# Medium [interval] = Transcripts (start,length)
	public function _M($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd` from `genes` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init:$len";
		}, $query);
		echo implode(";", $genes), "\n";
		$this->BindLevels($chr, $start, $stop);
		exit;
	}

	# Small [interval] = Transcripts (name,protein,start,length)
	public function _S($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd`, `name`, `strand`, `proteinID` from `genes` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init:$len:{$e['name']}:{$e['proteinID']}:{$e['strand']}";
		}, $query);
		echo implode(";", $genes), "\n";
		$this->BindLevels($chr, $start, $stop);
		exit;
	}

	# XSmall [interval] = Exons of genes
	public function _XS($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd`, `name`, `strand`, `proteinID`, `exonStarts`, `exonEnds`  from `genes` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init:$len:{$e['name']}:{$e['proteinID']}:{$e['strand']}:{$e['exonStarts']}:{$e['exonEnds']}";
		}, $query);
		echo implode(";", $genes), "\n";
		$this->BindLevels($chr, $start, $stop);
		exit;
	}
	
	# Load sample file
	public function _GetSample($file){
		$name = "samples/$file.csv";
		if (!file_exists($name)) die('false');
		echo file_get_contents($name);
	}

}
