# TEA. Transposable Elements Atlas

## Demo

Check out a working demo here [http://te-atlas.ga](http://te-atlas.ga)

![Detailed view of the chromosome](http://dev.mazepa.us/tea/media/sc1.png)

## Server side:

### Binding sites data

Download

~~~
mkdir chipseq && cd chipseq
HOST="http://hgdownload.cse.ucsc.edu/gbdb/hg38/bbi/wgEncodeReg"
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k27ac/
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k4me3/
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k4me1/
~~~

Convert bigWig to BedGraph

~~~
wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigWigToBedGraph
chmod +x bigWigToBedGraph
E=$(ls *.bigWig)
for i in $E; do ./bigWigToBedGraph $i $i.wig; done
~~~

Convert BedGraph to «.list»

~~~
wget http://dev.mazepa.us/tea/app/wigtolist
chmod +x wigtosql
T=0; for i in $(ls *27ac*.bed); do ./wigtolist $i $T '27ac'; let T=($T+1); done
T=0; for i in $(ls *4me1*.bed); do ./wigtolist $i $T '4me1'; let T=($T+1); done
T=0; for i in $(ls *4me3*.bed); do ./wigtolist $i $T '4me3'; let T=($T+1); done
~~~

...
