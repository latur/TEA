<?php
class Requests extends PDO {
	function __construct() {
		$this->db = new PDO('mysql:host='.DBHOST.';port=3306;dbname='.DBNAME.';charset=UTF8', DBUSER, DBPASS);
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$this->method  = @$_SERVER['REQUEST_METHOD'];
		$this->request = @$_SERVER['REQUEST_URI'];
		
		$pattern = "/tea/app/([LMSX]+)/(chr[0-9XY]+)/([0-9]+)/([0-9]+)";
		$url = str_replace('/', '\\/', $pattern);
		if (preg_match("/^$url$/", $this->request, $e)) {
			list($req, $mode, $chr, $start, $stop) = $e;
			$mode = "_$mode";
			if (method_exists($this, $mode)) $this->{$mode}($chr, $start, $stop);
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

	# Large [interval] = Transcripts inits (no repeats) by 32 base
	public function _L($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart` from `genome` 
			where `chrom` = ? and `txStart` > ? and `txStart` < ?
			group by `txStart` order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){ return base_convert($e['txStart'], 10, 32); }, $query);
		echo implode("\n", $genes);
		exit;
	}

	# Medium [interval] = Transcripts (start,length)
	public function _M($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd` from `genome` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init\t$len";
		}, $query);
		echo implode("\n", $genes);
		exit;
	}

	# Small [interval] = Transcripts (name,protein,start,length)
	public function _S($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd`, `name`, `strand`, `proteinID` from `genome` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init\t$len\t{$e['name']}\t{$e['proteinID']}\t{$e['strand']}";
		}, $query);
		echo implode("\n", $genes);
		exit;
	}

	# XSmall [interval] = Exons of genes
	public function _XS($chr, $start, $stop){
		$query = $this->FQuery("
			select `txStart`, `txEnd`, `name`, `strand`, `proteinID`, `exonStarts`, `exonEnds`  from `genome` 
			where `chrom` = ? and `txStart` > ? and `txEnd` < ?
			order by `txStart`", [$chr, $start, $stop]);
		$genes = array_map(function($e){
			$init = base_convert($e['txStart'], 10, 32);
			$len  = base_convert($e['txEnd'] - $e['txStart'], 10, 32);
			return "$init\t$len\t{$e['name']}\t{$e['proteinID']}\t{$e['strand']}\t{$e['exonStarts']}\t{$e['exonEnds']}";
		}, $query);
		echo implode("\n", $genes);
		exit;
	}
}
